'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, Map as MapIcon, List as ListIcon, MapPin, Droplets, Wind, ParkingCircle, Accessibility } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUpcomingPrayer, format12Hour } from '@/lib/utils';
import styles from './page.module.css';

// Dynamically import the map to avoid SSR issues with Leaflet
const MosqueMap = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>Loading Map...</div>
});

export default function MosqueDirectory() {
    const router = useRouter();
    const [view, setView] = useState<'list' | 'map'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [mosques, setMosques] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMosques() {
            const { data, error } = await supabase
                .from('mosques')
                .select(`
          *,
          facilities (*),
          prayers (*)
        `)
                .eq('is_approved', true);

            if (!error && data) {
                // Format to merge the joined arrays (Supabase returns 1-to-M as arrays even if 1-to-1)
                const formatted = data.map((d: any) => ({
                    ...d,
                    facilities: Array.isArray(d.facilities) ? (d.facilities[0] || {}) : (d.facilities || {}),
                    prayers: Array.isArray(d.prayers) ? (d.prayers[0] || {}) : (d.prayers || {})
                }));
                setMosques(formatted);
            }
            setLoading(false);
        }
        fetchMosques();
    }, []);

    const filteredMosques = mosques.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.area.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mosques in Allahabad</h1>
                <p className={styles.subtitle}>Find nearby mosques and accurate Jamat timings.</p>
            </header>

            <div className={styles.controlsGroup}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search by mosque name or area..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${view === 'list' ? styles.active : ''}`}
                        onClick={() => setView('list')}
                    >
                        <ListIcon size={18} /> List
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${view === 'map' ? styles.active : ''}`}
                        onClick={() => setView('map')}
                    >
                        <MapIcon size={18} /> Map
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading Mosques...</div>
            ) : view === 'map' ? (
                <MosqueMap mosques={filteredMosques} />
            ) : (
                <div className={styles.mosqueList}>
                    {filteredMosques.length === 0 ? (
                        <div className={styles.emptyState}>No mosques found matching your search.</div>
                    ) : (
                        filteredMosques.map((mosque) => {
                            // Calculate next prayer dynamically
                            const PRAYERS_ARR = [
                                { name: 'Fajr', adhan: mosque.prayers.fajr_adhan, iqamah: mosque.prayers.fajr_iqamah },
                                { name: 'Dhuhr', adhan: mosque.prayers.dhuhr_adhan, iqamah: mosque.prayers.dhuhr_iqamah },
                                { name: 'Asr', adhan: mosque.prayers.asr_adhan, iqamah: mosque.prayers.asr_iqamah },
                                { name: 'Maghrib', adhan: mosque.prayers.maghrib_adhan, iqamah: mosque.prayers.maghrib_iqamah },
                                { name: 'Isha', adhan: mosque.prayers.isha_adhan, iqamah: mosque.prayers.isha_iqamah },
                            ];
                            const upcoming = getUpcomingPrayer(PRAYERS_ARR, new Date());

                            return (
                                <div
                                    key={mosque.id}
                                    className={styles.mosqueCard}
                                    onClick={() => router.push(`/mosques/${mosque.id}`)}
                                >
                                    <div className={styles.mosqueInfo}>
                                        <h2 className={styles.mosqueName}>{mosque.name}</h2>
                                        <div className={styles.mosqueArea}>
                                            <MapPin size={14} /> {mosque.area}
                                        </div>
                                        <div className={styles.facilitiesIcons}>
                                            {mosque.facilities.has_wudu_area && <span title="Wudu Available"><Droplets size={16} /></span>}
                                            {mosque.facilities.has_ac && <span title="Air Conditioned"><Wind size={16} /></span>}
                                            {mosque.facilities.has_parking && <span title="Parking"><ParkingCircle size={16} /></span>}
                                            {mosque.facilities.has_wheelchair_access && <span title="Chair Accessible"><Accessibility size={16} /></span>}
                                        </div>
                                    </div>

                                    {upcoming && (
                                        <div className={styles.nextPrayerMini}>
                                            <div className={styles.npLabel}>{upcoming.name} {upcoming.type === 'Jamat' ? 'Jamat' : ''}</div>
                                            <div className={styles.npTime}>{format12Hour(upcoming.time)}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </main>
    );
}
