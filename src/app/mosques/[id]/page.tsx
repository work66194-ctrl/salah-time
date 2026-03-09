'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronLeft, MapPin, Droplets, Wind, ParkingCircle, Accessibility, Users, BookOpen, Clock, Calendar, Moon, Edit2, X, CheckCircle, Navigation, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format12Hour } from '@/lib/utils';
import { submitTimeSuggestion } from '@/app/actions/suggestTime';
import styles from './page.module.css';

const MosqueMap = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => <div style={{ height: 200, background: '#f8fafc' }}></div> });

export default function MosqueDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [mosque, setMosque] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Suggestion Modal State
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [suggestField, setSuggestField] = useState({ name: '', key: '', currentLine: '' });
    const [suggestedTime, setSuggestedTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const openSuggestModal = (prayerName: string, fieldKey: string, currentTime: string) => {
        setSuggestField({ name: prayerName, key: fieldKey, currentLine: currentTime || '--:--' });
        setSuggestedTime(currentTime || '');
        setSubmitSuccess(false);
        setIsSuggestModalOpen(true);
    };

    const handleSuggestSubmit = async () => {
        if (!suggestedTime) return;
        setIsSubmitting(true);
        const res = await submitTimeSuggestion(mosque.id, suggestField.key, suggestedTime);
        setIsSubmitting(false);
        if (res.success) {
            setSubmitSuccess(true);
            setTimeout(() => setIsSuggestModalOpen(false), 2500);
        } else {
            alert('Failed to submit suggestion: ' + res.error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `${mosque.name} - Salah Time`,
            text: `View prayer timings and details for ${mosque.name} in ${mosque.area || 'our directory'}.`,
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback for desktop/unsupported browsers
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handleDirections = () => {
        if (!mosque.latitude || !mosque.longitude) return;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
        window.open(mapsUrl, '_blank');
    };

    useEffect(() => {
        async function fetchMosque() {
            const { data, error } = await supabase
                .from('mosques')
                .select(`
          *,
          facilities (*),
          prayers (*)
        `)
                .eq('id', id)
                .single();

            if (!error && data) {
                setMosque({
                    ...data,
                    facilities: Array.isArray(data.facilities) ? (data.facilities[0] || {}) : (data.facilities || {}),
                    prayers: Array.isArray(data.prayers) ? (data.prayers[0] || {}) : (data.prayers || {})
                });
            }
            setLoading(false);
        }
        fetchMosque();
    }, [id]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Mosque Details...</div>;
    if (!mosque) return <div style={{ padding: 40, textAlign: 'center' }}>Mosque not found</div>;

    const PRAYERS = [
        { name: 'Fajr', adhan: mosque.prayers?.fajr_adhan, iqamah: mosque.prayers?.fajr_iqamah, adhanKey: 'fajr_adhan', iqamahKey: 'fajr_iqamah' },
        { name: 'Dhuhr', adhan: mosque.prayers?.dhuhr_adhan, iqamah: mosque.prayers?.dhuhr_iqamah, adhanKey: 'dhuhr_adhan', iqamahKey: 'dhuhr_iqamah' },
        { name: 'Asr', adhan: mosque.prayers?.asr_adhan, iqamah: mosque.prayers?.asr_iqamah, adhanKey: 'asr_adhan', iqamahKey: 'asr_iqamah' },
        { name: 'Maghrib', adhan: mosque.prayers?.maghrib_adhan, iqamah: mosque.prayers?.maghrib_iqamah, adhanKey: 'maghrib_adhan', iqamahKey: 'maghrib_iqamah' },
        { name: 'Isha', adhan: mosque.prayers?.isha_adhan, iqamah: mosque.prayers?.isha_iqamah, adhanKey: 'isha_adhan', iqamahKey: 'isha_iqamah' },
    ];

    return (
        <main className={styles.container}>
            <button className={styles.backBtn} onClick={() => router.back()}>
                <ChevronLeft size={24} />
            </button>

            {/* Mini Map Header */}
            <div className={styles.mapHeader}>
                <MosqueMap mosques={[mosque]} height="100%" />
            </div>

            <div className={styles.headerContent}>
                <h1 className={styles.title}>{mosque.name}</h1>
                <div className={styles.address}>
                    <MapPin size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary-color)' }} />
                    <span>{mosque.address}</span>
                </div>

                {/* Quick Actions */}
                <div className={styles.actionRow}>
                    <button onClick={handleDirections} className={styles.actionBtn} aria-label="Get Directions via Google Maps">
                        <Navigation size={18} />
                        Directions
                    </button>
                    <button onClick={handleShare} className={styles.actionBtn} aria-label="Share Link">
                        <Share2 size={18} />
                        Share
                    </button>
                </div>

                {/* Facilities */}
                <div className={styles.facilitiesGrid}>
                    {mosque.facilities?.has_wudu_area && <div className={styles.facilityBadge}><Droplets size={16} /> Wudu Area</div>}
                    {mosque.facilities?.has_womens_area && <div className={styles.facilityBadge}><Users size={16} /> Women's Area</div>}
                    {mosque.facilities?.has_ac && <div className={styles.facilityBadge}><Wind size={16} /> AC</div>}
                    {mosque.facilities?.has_parking && <div className={styles.facilityBadge}><ParkingCircle size={16} /> Parking</div>}
                    {mosque.facilities?.has_wheelchair_access && <div className={styles.facilityBadge}><Accessibility size={16} /> Chair</div>}
                    {mosque.facilities?.has_library && <div className={styles.facilityBadge}><BookOpen size={16} /> Library</div>}
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}><Clock size={20} color="var(--primary-color)" /> Prayer Timetable</h2>
                <div className={styles.timetable}>
                    <div className={styles.tableHeader}>
                        <div>Prayer</div>
                        <div>Adhan</div>
                        <div>Jamat Time</div>
                    </div>
                    {PRAYERS.map(p => (
                        <div key={p.name} className={styles.tableRow} style={{ flexWrap: 'wrap' }}>
                            <div className={styles.prayerName}>{p.name}</div>
                            <div className={styles.timeCol} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {format12Hour(p.adhan)}
                                <button onClick={() => openSuggestModal(`${p.name} Adhan`, p.adhanKey, p.adhan)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            <div className={styles.iqamahCol} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {format12Hour(p.iqamah)}
                                <button onClick={() => openSuggestModal(`${p.name} Jamat`, p.iqamahKey, p.iqamah)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                {/* Jumu'ah Section */}
                {mosque.prayers?.jumuah_iqamah && (
                    <div className={styles.specialCard}>
                        <h3><Calendar size={18} /> Jumu'ah (Friday Prayer)</h3>
                        {mosque.prayers.jumuah_khutbah && (
                            <div className={styles.specialRow}>
                                <span>Khutbah Starts</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <strong>{format12Hour(mosque.prayers.jumuah_khutbah)}</strong>
                                    <button onClick={() => openSuggestModal("Jumu'ah Khutbah", "jumuah_khutbah", mosque.prayers.jumuah_khutbah)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={styles.specialRow}>
                            <span>Jamat Time</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>{format12Hour(mosque.prayers.jumuah_iqamah)}</strong>
                                <button onClick={() => openSuggestModal("Jumu'ah Jamat", "jumuah_iqamah", mosque.prayers.jumuah_iqamah)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ramadan Section */}
                {mosque.prayers?.ramadan_taraweeh && (
                    <div className={styles.specialCard} style={{ background: 'linear-gradient(135deg, rgba(4, 122, 85, 0.05), rgba(4, 122, 85, 0.15))', borderColor: 'rgba(4, 122, 85, 0.2)' }}>
                        <h3 style={{ color: 'var(--primary-color)' }}><Moon size={18} /> Ramadan Information</h3>
                        <div className={styles.specialRow}>
                            <span>Taraweeh Prayer</span>
                            <strong>{format12Hour(mosque.prayers.ramadan_taraweeh)}</strong>
                        </div>
                        {mosque.prayers.ramadan_announcements && (
                            <div style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {mosque.prayers.ramadan_announcements}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Suggestion Modal overlay */}
            {isSuggestModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <button onClick={() => setIsSuggestModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>

                        {submitSuccess ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <CheckCircle size={48} color="var(--primary-color)" style={{ margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Suggestion Submitted!</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Jazakallah Khair. An admin will review your suggested time.</p>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Suggest Time Change</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                    Know a more accurate time for <strong>{suggestField.name}</strong>? Suggest an edit to help the community.
                                </p>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>Current Time</label>
                                    <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        {format12Hour(suggestField.currentLine)}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Suggested Time</label>
                                    <input
                                        type="time"
                                        value={suggestedTime}
                                        onChange={(e) => setSuggestedTime(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)' }}
                                    />
                                </div>

                                <button
                                    onClick={handleSuggestSubmit}
                                    disabled={isSubmitting || !suggestedTime}
                                    className="btn-primary"
                                    style={{ width: '100%' }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

        </main>
    );
}
