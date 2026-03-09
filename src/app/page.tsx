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

type TimingsData = {
  prayers: PrayerRow[];
  hijriDate: string;
};

async function fetchTimes(method: number, school: 0 | 1 = 0): Promise<TimingsData> {
  const today = format(new Date(), 'dd-MM-yyyy');
  // Pass an adjustment offset parameter (e.g. -1 days) to correctly calibrate the local Hijri date.
  const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${LAT}&longitude=${LON}&method=${method}&school=${school}&adjustment=-1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan API error');
  const json = await res.json();
  const t = json.data.timings;
  const hijri = json.data.date.hijri;

  return {
    prayers: [
      { name: 'Fajr', start: t.Fajr, end: t.Sunrise },
      { name: 'Dhuhr', start: t.Dhuhr, end: t.Asr },
      { name: 'Asr', start: t.Asr, end: t.Maghrib },
      { name: 'Maghrib', start: t.Maghrib, end: t.Isha },
      { name: 'Isha', start: t.Isha, end: t.Midnight },
    ],
    hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`
  };
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [nextPrayerTarget, setNextPrayerTarget] = useState<string>('');

  const [standardTimes, setStandardTimes] = useState<PrayerRow[]>([]);
  const [hanafiTimes, setHanafiTimes] = useState<PrayerRow[]>([]);
  const [shiaTimes, setShiaTimes] = useState<PrayerRow[]>([]);
  const [hijriDateStr, setHijriDateStr] = useState<string>('');
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
        setStandardTimes(std.prayers);
        setHanafiTimes(han.prayers);
        setShiaTimes(shia.prayers);
        setHijriDateStr(std.hijriDate);
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


  return (
    <main className={styles.homeContainer}>

      {/* Location Header */}
      <header className={styles.headerLocation}>
        <h1 className={styles.cityTitle}>
          <MapPin size={24} color="var(--primary-color)" />
          Allahabad (Prayagraj)
        </h1>
        <p className={styles.dateSubtitle}>
          {currentTime
            ? `${format(currentTime, 'EEEE, d MMMM yyyy')} ${hijriDateStr ? `• ${hijriDateStr}` : ''}`
            : '\u00A0'}
        </p>
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
            <div style={{ opacity: 0.5 }}>
              <div className={styles.nextPrayerLabel}>Next Prayer: ...</div>
              <div className={styles.countdownTimer}>--:--:--</div>
              <div className={styles.upcomingTarget}>Target: ...</div>
            </div>
          ) : cityTimes.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No mosque data available yet. Please add data!</div>
          ) : (
            <>
              <div className={styles.nextPrayerLabel}>Next Prayer: {nextPrayerName || '...'}</div>
              <div className={styles.countdownTimer}>
                {currentTime ? formatTimeRemaining(timeLeft) : '--:--:--'}
              </div>
              <div className={styles.upcomingTarget}>
                Target: {nextPrayerTarget || '...'}
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
            <>
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => (
                <div key={name} className={styles.prayerRow} style={{ opacity: 0.5 }}>
                  <span className={styles.prayerName}>{name}</span>
                  <div className={styles.prayerTimes}>
                    <span>--:--</span>
                    <span>--:--</span>
                  </div>
                </div>
              ))}
            </>
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

      {/* Informational Sections */}
      <section className={styles.infoSection}>
        <div className={styles.infoBlock}>
          <h2 className={styles.infoTitle}>Core Services</h2>
          <ul className={styles.infoList}>
            <li><strong>Live Prayer Timings:</strong> Highly accurate Salah calculations for Allahabad, updated in real-time.</li>
            <li><strong>Mosque Locator:</strong> Find nearby Masjids with their specific Jamat (Congregation) timings.</li>
            <li><strong>One-Click Navigation:</strong> Open any mosque's location directly in Google Maps.</li>
            <li><strong>Community Contributions:</strong> A free platform for anyone to add their local mosque and help others find it.</li>
          </ul>
        </div>

        <div className={styles.infoBlock}>
          <h2 className={styles.infoTitle}>Why Use Salah Time?</h2>
          <ul className={styles.infoList}>
            <li><strong>100% Free Forever:</strong> No subscriptions, no hidden costs, and no data collection.</li>
            <li><strong>Zero Ads:</strong> A clean, distraction-free experience designed for worship and focus.</li>
            <li><strong>Community Focused:</strong> Built by the community, for the community, as a Sadaqah Jariyah initiative.</li>
            <li><strong>Always Accessible:</strong> Fast, lightweight, and mobile-friendly access to prayer times anywhere.</li>
          </ul>
        </div>
      </section>

    </main>
  );
}
