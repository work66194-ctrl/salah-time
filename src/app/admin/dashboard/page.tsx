'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, LogOut, Clock, Layers, Calendar, ChevronDown, CheckCircle, AlertCircle, ClipboardList, Trash2, Check, X, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPendingMosques, approveMosque, rejectMosque } from '@/app/actions/approveMosque';
import { deleteMosque } from '@/app/actions/deleteMosque';
import { getPendingSuggestions, approveSuggestion, rejectSuggestion } from '@/app/actions/manageSuggestions';
import { format12Hour } from '@/lib/utils';
import styles from './page.module.css';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'manage' | 'pending' | 'suggestions'>('manage');
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [mosques, setMosques] = useState<any[]>([]);
    const [pendingMosques, setPendingMosques] = useState<any[]>([]);
    const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);
    const [activeMosqueId, setActiveMosqueId] = useState<string>('');
    const [activeMosqueName, setActiveMosqueName] = useState<string>('');
    const [approvingId, setApprovingId] = useState<string | null>(null);

    // Location State
    const [area, setArea] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Form State
    const [prayers, setPrayers] = useState<any>({});
    const [facilities, setFacilities] = useState<any>({});

    // Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                router.push('/admin');
            } else {
                setLoadingAuth(false);
                fetchMosques();
                fetchPendingMosques();
                fetchSuggestions();
            }
        };
        checkAuth();
    }, []);

    // Re-fetch approved mosques whenever user switches to the manage tab
    useEffect(() => {
        if (!loadingAuth && activeTab === 'manage') {
            fetchMosques();
        }
    }, [activeTab]);

    const fetchMosques = async () => {
        setLoadingData(true);
        const { data, error } = await supabase
            .from('mosques')
            .select(`
                id, 
                name, 
                area,
                address,
                latitude,
                longitude,
                prayers (*),
                facilities (*)
            `)
            .eq('is_approved', true)
            .order('name');

        if (!error && data && data.length > 0) {
            setMosques(data);
            handleSelectMosque(data[0].id, data);
        }
        setLoadingData(false);
    };

    const fetchPendingMosques = async () => {
        const result = await getPendingMosques();
        setPendingMosques(result.data || []);
    };

    const fetchSuggestions = async () => {
        const result = await getPendingSuggestions();
        setPendingSuggestions(result.data || []);
    };

    const handleSelectMosque = (id: string, mosqueList = mosques) => {
        const m = mosqueList.find(x => x.id === id);
        if (m) {
            setActiveMosqueId(id);
            setActiveMosqueName(`${m.name} (${m.area})`);

            setArea(m.area || '');
            setAddress(m.address || '');
            setLatitude(m.latitude || '');
            setLongitude(m.longitude || '');

            const p = Array.isArray(m.prayers) ? m.prayers[0] || {} : m.prayers || {};
            const f = Array.isArray(m.facilities) ? m.facilities[0] || {} : m.facilities || {};

            setPrayers({
                fajr_adhan: p.fajr_adhan || '', fajr_iqamah: p.fajr_iqamah || '',
                dhuhr_adhan: p.dhuhr_adhan || '', dhuhr_iqamah: p.dhuhr_iqamah || '',
                asr_adhan: p.asr_adhan || '', asr_iqamah: p.asr_iqamah || '',
                maghrib_adhan: p.maghrib_adhan || '', maghrib_iqamah: p.maghrib_iqamah || '',
                isha_adhan: p.isha_adhan || '', isha_iqamah: p.isha_iqamah || '',
                jumuah_khutbah: p.jumuah_khutbah || '', jumuah_iqamah: p.jumuah_iqamah || '',
            });

            setFacilities({
                has_wudu_area: !!f.has_wudu_area,
                has_womens_area: !!f.has_womens_area,
                has_wheelchair_access: !!f.has_wheelchair_access,
                has_ac: !!f.has_ac,
                has_parking: !!f.has_parking,
                has_library: !!f.has_library
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg(null);

        const { error: mError } = await supabase
            .from('mosques')
            .update({
                area,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            })
            .eq('id', activeMosqueId);

        const { error: pError } = await supabase
            .from('prayers')
            .update(prayers)
            .eq('mosque_id', activeMosqueId);

        const { error: fError } = await supabase
            .from('facilities')
            .update(facilities)
            .eq('mosque_id', activeMosqueId);

        setSaving(false);

        if (pError || fError || mError) {
            setStatusMsg({ type: 'error', text: `Failed to save: RLS Policy Error. You need to enable UPDATE policies in Supabase.` });
            console.error(pError || fError || mError);
        } else {
            setStatusMsg({ type: 'success', text: 'Changes saved successfully!' });
            setTimeout(() => setStatusMsg(null), 3000);
            fetchMosques();
        }
    };

    const handleDeleteMosque = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm(`Are you sure you want to delete "${activeMosqueName}"? This cannot be undone and will remove all prayer times associated with it.`)) return;

        setSaving(true);
        setStatusMsg(null);

        const result = await deleteMosque(activeMosqueId);

        if (result.error) {
            setStatusMsg({ type: 'error', text: `Failed to delete: ${result.error}` });
            setSaving(false);
        } else {
            setStatusMsg({ type: 'success', text: `"${activeMosqueName}" has been successfully deleted.` });
            setTimeout(() => setStatusMsg(null), 4000);
            fetchMosques();
        }
    };

    const handleApprove = async (mosqueId: string) => {
        setApprovingId(mosqueId);
        const result = await approveMosque(mosqueId);
        if (result.error) {
            setStatusMsg({ type: 'error', text: `Failed to approve: ${result.error}` });
        } else {
            setStatusMsg({ type: 'success', text: 'Mosque approved! It is now live on the platform.' });
            setTimeout(() => setStatusMsg(null), 4000);
            fetchPendingMosques();
            fetchMosques();
        }
        setApprovingId(null);
    };

    const handleReject = async (mosqueId: string, mosqueName: string) => {
        if (!confirm(`Are you sure you want to REJECT and delete "${mosqueName}"? This cannot be undone.`)) return;
        setApprovingId(mosqueId);
        const result = await rejectMosque(mosqueId);
        if (result.error) {
            setStatusMsg({ type: 'error', text: `Failed to reject: ${result.error}` });
        } else {
            setStatusMsg({ type: 'success', text: `"${mosqueName}" has been rejected and removed.` });
            setTimeout(() => setStatusMsg(null), 4000);
            fetchPendingMosques();
        }
        setApprovingId(null);
    };

    const handleApproveSuggestion = async (suggestionId: string, mosqueId: string, prayerField: string, newTime: string) => {
        setApprovingId(suggestionId);
        const result = await approveSuggestion(suggestionId, mosqueId, prayerField, newTime);
        if (result.error) {
            setStatusMsg({ type: 'error', text: `Failed to approve suggestion: ${result.error}` });
        } else {
            setStatusMsg({ type: 'success', text: 'Time change approved & database updated!' });
            setTimeout(() => setStatusMsg(null), 3000);
            fetchSuggestions();
            fetchMosques(); // Refresh active dashboard inputs
        }
        setApprovingId(null);
    };

    const handleRejectSuggestion = async (suggestionId: string) => {
        setApprovingId(suggestionId);
        const result = await rejectSuggestion(suggestionId);
        if (result.error) {
            setStatusMsg({ type: 'error', text: `Failed to reject suggestion: ${result.error}` });
        } else {
            setStatusMsg({ type: 'success', text: 'Suggestion rejected.' });
            setTimeout(() => setStatusMsg(null), 3000);
            fetchSuggestions();
        }
        setApprovingId(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setPrayers({ ...prayers, [field]: e.target.value });
    };

    const toggleFacility = (field: string) => {
        setFacilities({ ...facilities, [field]: !facilities[field] });
    };

    const prayerFields = [
        { name: 'Fajr', adhanKey: 'fajr_adhan', iqamahKey: 'fajr_iqamah' },
        { name: 'Dhuhr', adhanKey: 'dhuhr_adhan', iqamahKey: 'dhuhr_iqamah' },
        { name: 'Asr', adhanKey: 'asr_adhan', iqamahKey: 'asr_iqamah' },
        { name: 'Maghrib', adhanKey: 'maghrib_adhan', iqamahKey: 'maghrib_iqamah' },
        { name: 'Isha', adhanKey: 'isha_adhan', iqamahKey: 'isha_iqamah' },
    ];

    const facilityLabels: Record<string, string> = {
        has_wudu_area: 'Wudu Area',
        has_womens_area: "Women's Area",
        has_ac: 'AC',
        has_wheelchair_access: 'Chair',
        has_parking: 'Parking',
        has_library: 'Library',
    };

    if (loadingAuth || loadingData) return <div className={styles.container}>Loading Dashboard...</div>;

    return (
        <main className={styles.container}>
            <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className={styles.title}>Admin Dashboard</h1>
                </div>
                <button onClick={handleLogout} style={{ color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.9rem', padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={18} /> Logout
                </button>
            </header>

            {/* Scrollable Tabs Wrapper for Mobile */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <button
                    onClick={() => setActiveTab('manage')}
                    style={{
                        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap',
                        color: activeTab === 'manage' ? 'var(--primary-color)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'manage' ? '2px solid var(--primary-color)' : '2px solid transparent',
                        marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                    <Save size={16} /> Manage Mosques
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap',
                        color: activeTab === 'pending' ? 'var(--primary-color)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'pending' ? '2px solid var(--primary-color)' : '2px solid transparent',
                        marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                    <ClipboardList size={16} /> New Mosques
                    {pendingMosques.length > 0 && <span style={{ background: '#EF4444', color: 'white', borderRadius: '999px', padding: '1px 8px', fontSize: '0.8rem' }}>{pendingMosques.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('suggestions')}
                    style={{
                        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap',
                        color: activeTab === 'suggestions' ? 'var(--primary-color)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'suggestions' ? '2px solid var(--primary-color)' : '2px solid transparent',
                        marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                    <Clock size={16} /> Time Suggestions
                    {pendingSuggestions.length > 0 && <span style={{ background: '#F59E0B', color: 'white', borderRadius: '999px', padding: '1px 8px', fontSize: '0.8rem' }}>{pendingSuggestions.length}</span>}
                </button>
            </div>

            {
                statusMsg && (
                    <div style={{ background: statusMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: statusMsg.type === 'success' ? '#065F46' : '#B91C1C', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <div style={{ flex: 1 }}>{statusMsg.text}</div>
                    </div>
                )
            }

            {/* ── TAB: Manage Mosques ── */}
            {
                activeTab === 'manage' && (
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Editing mosque:</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={activeMosqueId}
                                    onChange={(e) => handleSelectMosque(e.target.value)}
                                    style={{ padding: '8px 36px 8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--surface-color)', color: 'var(--primary-color)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', appearance: 'none' }}
                                >
                                    {mosques.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.area})</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Location Details Section */}
                        <section className={styles.section} style={{ marginBottom: '32px' }}>
                            <h2 className={styles.sectionTitle} style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                                <MapPin size={20} color="var(--primary-color)" /> Location Details
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Area / Neighborhood</label>
                                    <input type="text" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Address</label>
                                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', resize: 'vertical', color: 'var(--text-primary)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Latitude</label>
                                        <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Longitude</label>
                                        <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Daily Prayers Section */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}><Clock size={20} color="var(--primary-color)" /> Daily Timetable</h2>
                            <div className={styles.formGrid}>
                                {prayerFields.map((p) => (
                                    <div key={p.name} className={styles.formRow}>
                                        <div className={styles.prayerNameLabel}>{p.name}</div>
                                        <div>
                                            <label className={styles.formLabel}>Adhan</label>
                                            <input type="time" className={styles.formInput} value={prayers[p.adhanKey] || ''} onChange={(e) => handleChange(e, p.adhanKey)} />
                                        </div>
                                        <div>
                                            <label className={styles.formLabel}>Jamat Time</label>
                                            <input type="time" className={styles.formInput} value={prayers[p.iqamahKey] || ''} onChange={(e) => handleChange(e, p.iqamahKey)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Jumu'ah Section */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}><Calendar size={20} color="var(--primary-color)" /> Friday (Jumu'ah)</h2>
                            <div className={styles.formRow}>
                                <div>
                                    <label className={styles.formLabel}>Khutbah Starts</label>
                                    <input type="time" className={styles.formInput} value={prayers.jumuah_khutbah || ''} onChange={(e) => handleChange(e, 'jumuah_khutbah')} />
                                </div>
                                <div>
                                    <label className={styles.formLabel}>Iqamah</label>
                                    <input type="time" className={styles.formInput} value={prayers.jumuah_iqamah || ''} onChange={(e) => handleChange(e, 'jumuah_iqamah')} />
                                </div>
                            </div>
                        </section>

                        {/* Facilities Section */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}><Layers size={20} color="var(--primary-color)" /> Mosque Facilities</h2>
                            <div className={styles.facilitiesGrid}>
                                <label className={styles.checkboxLabel}><input type="checkbox" checked={facilities.has_wudu_area} onChange={() => toggleFacility('has_wudu_area')} /> Wudu Area</label>
                                <label className={styles.checkboxLabel}><input type="checkbox" checked={facilities.has_womens_area} onChange={() => toggleFacility('has_womens_area')} /> Women's Area</label>
                                <label className={styles.checkboxLabel}><input type="checkbox" checked={facilities.has_ac} onChange={() => toggleFacility('has_ac')} /> Air Conditioning</label>
                                <label className={styles.checkboxLabel}><input type="checkbox" checked={facilities.has_wheelchair_access} onChange={() => toggleFacility('has_wheelchair_access')} /> Chair Access</label>
                                <label className={styles.checkboxLabel}><input type="checkbox" checked={facilities.has_parking} onChange={() => toggleFacility('has_parking')} /> Parking</label>
                                <label className={styles.checkboxLabel}><input type="checkbox" checked={facilities.has_library} onChange={() => toggleFacility('has_library')} /> Library</label>
                            </div>
                        </section>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '80px', flexWrap: 'wrap' }}>
                            <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={saving}>
                                {saving ? 'Saving...' : <><Save size={20} /> Publish Updates</>}
                            </button>
                            {activeMosqueId && (
                                <button type="button" onClick={handleDeleteMosque} disabled={saving} style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #F87171', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Trash2 size={20} /> Delete Mosque
                                </button>
                            )}
                        </div>
                    </form>
                )
            }

            {/* ── TAB: Pending Approvals ── */}
            {
                activeTab === 'pending' && (
                    <div>
                        {pendingMosques.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                <CheckCircle size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Pending Submissions</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>All registered mosques have been reviewed.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '60px' }}>
                                {pendingMosques.map((mosque) => {
                                    const f = Array.isArray(mosque.facilities) ? mosque.facilities[0] || {} : mosque.facilities || {};
                                    const enabledFacilities = Object.entries(facilityLabels).filter(([key]) => f[key]);
                                    const isProcessing = approvingId === mosque.id;

                                    return (
                                        <div key={mosque.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{mosque.name}</h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>📍 {mosque.area}</p>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{mosque.address}</p>
                                                    {mosque.latitude && mosque.longitude && (
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', fontFamily: 'monospace' }}>
                                                            {mosque.latitude}, {mosque.longitude}
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => handleApprove(mosque.id)}
                                                        disabled={isProcessing}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: isProcessing ? 0.6 : 1 }}>
                                                        <Check size={16} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(mosque.id, mosque.name)}
                                                        disabled={isProcessing}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: isProcessing ? 0.6 : 1 }}>
                                                        <X size={16} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                            {enabledFacilities.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {enabledFacilities.map(([, label]) => (
                                                        <span key={label} style={{ background: 'rgba(4, 122, 85, 0.1)', color: 'var(--primary-color)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                                                Submitted: {new Date(mosque.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            }

            {/* ── TAB: Time Suggestions ── */}
            {
                activeTab === 'suggestions' && (
                    <div>
                        {pendingSuggestions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                                <CheckCircle size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Pending Time Suggestions</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>User suggested time edits will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '60px' }}>
                                {pendingSuggestions.map((sug) => {
                                    const isProcessing = approvingId === sug.id;
                                    // Convert "fajr_adhan" -> "Fajr Adhan"
                                    const formattedField = sug.prayer_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

                                    return (
                                        <div key={sug.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid #F59E0B' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {sug.mosques.name}
                                                    </h3>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                                                        📍 {sug.mosques.area}
                                                    </p>

                                                    <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', marginTop: '12px', display: 'inline-block' }}>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Suggested Edit:</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.05rem' }}>
                                                            <span style={{ fontWeight: 600 }}>{formattedField}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                            <span style={{ color: 'var(--primary-color)', fontWeight: 700, background: 'rgba(4, 122, 85, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                                                {format12Hour(sug.suggested_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => handleApproveSuggestion(sug.id, sug.mosque_id, sug.prayer_name, sug.suggested_time)}
                                                        disabled={isProcessing}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: isProcessing ? 0.6 : 1 }}>
                                                        <Check size={16} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectSuggestion(sug.id)}
                                                        disabled={isProcessing}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: isProcessing ? 0.6 : 1 }}>
                                                        <X size={16} /> Reject
                                                    </button>
                                                </div>
                                            </div>

                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, marginTop: '8px' }}>
                                                Submitted: {new Date(sug.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            }
        </main >
    );
}
