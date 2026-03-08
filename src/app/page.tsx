'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Navigation } from 'lucide-react';
import { getUpcomingPrayer, formatTimeRemaining, format12Hour } from '@/lib/utils';
import styles from './page.module.css';

// Allahabad (Prayagraj) coordinates
const LAT = 25.4358;
const LON = 81.8464;

type PrayerRow = { name: string; start: string; end: string };

async function fetchTimes(method: number, school: 0 | 1 = 0): Promise<PrayerRow[]> {
  const today = format(new Date(), 'dd-MM-yyyy');
  const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${LAT}&longitude=${LON}&method=${method}&school=${school}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan API error');
  const json = await res.json();
  const t = json.data.timings;
  return [
    { name: 'Fajr', start: t.Fajr, end: t.Sunrise },
    { name: 'Dhuhr', start: t.Dhuhr, end: t.Asr },
    { name: 'Asr', start: t.Asr, end: t.Maghrib },
    { name: 'Maghrib', start: t.Maghrib, end: t.Isha },
    { name: 'Isha', start: t.Isha, end: t.Midnight },
  ];
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [nextPrayerTarget, setNextPrayerTarget] = useState<string>('');

  const [standardTimes, setStandardTimes] = useState<PrayerRow[]>([]);
  const [hanafiTimes, setHanafiTimes] = useState<PrayerRow[]>([]);
  const [shiaTimes, setShiaTimes] = useState<PrayerRow[]>([]);
  const [school, setSchool] = useState<'standard' | 'hanafi' | 'shia'>('standard');
  const [loading, setLoading] = useState(true);

  const cityTimes = school === 'hanafi' ? hanafiTimes : school === 'shia' ? shiaTimes : standardTimes;

  // Fetch standard, Hanafi, and Shia times in parallel
  useEffect(() => {
    Promise.all([
      fetchTimes(5, 0),   // Umm Al-Qura, Shafi
      fetchTimes(5, 1),   // Umm Al-Qura, Hanafi
      fetchTimes(0, 0),   // Shia Ithna Ashari
    ])
      .then(([std, han, shia]) => {
        setStandardTimes(std);
        setHanafiTimes(han);
        setShiaTimes(shia);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Update Countdown Timer
  useEffect(() => {
    setCurrentTime(new Date());
    if (cityTimes.length === 0) return;

    const mapped = cityTimes.map((p) => ({ name: p.name, adhan: p.start, iqamah: p.start }));

    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const upcoming = getUpcomingPrayer(mapped, now);
      if (upcoming) {
        setTimeLeft(upcoming.secondsRemaining);
        setNextPrayerName(upcoming.name);
        setNextPrayerTarget(`${format12Hour(upcoming.time)} (starts)`);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [cityTimes]);

  if (!currentTime) {
    return <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return (
    <main className={styles.homeContainer}>

      {/* Location Header */}
      <header className={styles.headerLocation}>
        <h1 className={styles.cityTitle}>
          <MapPin size={24} color="var(--primary-color)" />
          Allahabad (Prayagraj)
        </h1>
        <p className={styles.dateSubtitle}>{format(currentTime, 'EEEE, d MMMM yyyy')}</p>
      </header>

      {/* Hadith */}
      <div className={styles.quranVerse}>
        <p className={styles.arabicText} dir="rtl">أَوَّلُ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ الصَّلَاةُ</p>
        <p className={styles.translationText}>&quot;The first matter that the slave will be brought to account for on the Day of Judgment is the prayer.&quot;</p>
        <p className={styles.referenceText}>— Prophet Muhammad (ﷺ)<br />Sunan al-Tirmidhi</p>
      </div>

      {/* Desktop Grid Layout */}
      <div className={styles.topSection}>
        {/* Countdown Card */}
        <div className={styles.countdownCard}>
          {loading ? (
            <div style={{ opacity: 0.8 }}>Loading Timetable...</div>
          ) : cityTimes.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No mosque data available yet. Please add data!</div>
          ) : (
            <>
              <div className={styles.nextPrayerLabel}>Next Prayer: {nextPrayerName}</div>
              <div className={styles.countdownTimer}>
                {formatTimeRemaining(timeLeft)}
              </div>
              <div className={styles.upcomingTarget}>
                Target: {nextPrayerTarget}
              </div>
            </>
          )}
        </div>

        {/* Today's General Timings */}
        <div className={styles.prayerList}>
          <div className={styles.prayerListHeader}>
            <div>
              <h2>General Prayer Timings</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Umm Al-Qura, Makkah · Allahabad
              </p>
            </div>

            {/* School toggle */}
            <div className={styles.schoolToggle}>
              <button
                className={`${styles.toggleBtn} ${school === 'standard' ? styles.toggleActive : ''}`}
                onClick={() => setSchool('standard')}
                title="Shafi / Standard (Asr: shadow = 1×)"
              >
                Shafi
              </button>
              <button
                className={`${styles.toggleBtn} ${school === 'hanafi' ? styles.toggleActive : ''}`}
                onClick={() => setSchool('hanafi')}
                title="Hanafi (Asr: shadow = 2×)"
              >
                Hanafi
              </button>
              <button
                className={`${styles.toggleBtn} ${school === 'shia' ? styles.toggleActive : ''}`}
                onClick={() => setSchool('shia')}
                title="Shia Ithna Ashari method"
              >
                Shia
              </button>
            </div>
          </div>

          <div className={styles.prayerRow} style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>Prayer</span>
            <div className={styles.prayerTimes}>
              <span>Start</span>
              <span>End</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : cityTimes.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Could not load timings. Check your connection.</div>
          ) : (
            cityTimes.map((prayer) => {
              const isActive = nextPrayerName === prayer.name;
              return (
                <div key={prayer.name} className={`${styles.prayerRow} ${isActive ? styles.active : ''}`}>
                  <span className={styles.prayerName}>{prayer.name}</span>
                  <div className={styles.prayerTimes}>
                    <span>{format12Hour(prayer.start)}</span>
                    <span>{format12Hour(prayer.end)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Suhoor & Iftar */}
      {!loading && cityTimes.length > 0 && (() => {
        const fajr = cityTimes.find(p => p.name === 'Fajr');
        const maghrib = cityTimes.find(p => p.name === 'Maghrib');
        return (
          <div className={styles.ramadanBanner}>
            <div className={styles.ramadanItem}>
              <span className={styles.ramadanIcon}>🌙</span>
              <div>
                <div className={styles.ramadanLabel}>Suhoor Ends</div>
                <div className={styles.ramadanTime}>{format12Hour(fajr?.start ?? '')}</div>
              </div>
            </div>
            <div className={styles.ramadanDivider} />
            <div className={styles.ramadanItem}>
              <span className={styles.ramadanIcon}>🌅</span>
              <div>
                <div className={styles.ramadanLabel}>Iftar Begins</div>
                <div className={styles.ramadanTime}>{format12Hour(maghrib?.start ?? '')}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Action Button */}
      <div className={styles.ctaSection}>
        <Link href="/mosques" className={`btn-primary ${styles.mosqueButton}`}>
          <Navigation size={20} />
          Find Nearby Mosques
        </Link>
      </div>

    </main>
  );
}
