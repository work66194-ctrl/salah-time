'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Building, Droplets, Wind, ParkingCircle, Accessibility, Users, BookOpen, Link as LinkIcon } from 'lucide-react';
import { submitMosqueRegistration } from '../actions/registerMosque';
import { resolveShortUrl } from '../actions/resolveUrl';

export default function RegisterMosque() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [isResolvingLink, setIsResolvingLink] = useState(false);

    const handleMapLinkPaste = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        if (!url) return;

        // If it's a shortened goo.gl link, we need to resolve it first
        let finalUrl = url;
        // If it's a shortened goo.gl link, we need to resolve it first via server action to bypass CORS
        if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
            setIsResolvingLink(true);
            const res = await resolveShortUrl(url);
            if (res.success && res.url) {
                finalUrl = res.url;
            }
            setIsResolvingLink(false);
        }

        const matchAt = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const matchQ = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        const matchPlace = finalUrl.match(/place\/.*\/@?(-?\d+\.\d+),(-?\d+\.\d+)/);

        const match = matchAt || matchQ || matchPlace;
        if (match) {
            setLatitude(match[1]);
            setLongitude(match[2]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const res = await submitMosqueRegistration(formData);

        if (res.error) {
            setError(res.error);
        } else if (res.success) {
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
        }
        setLoading(false);
    };

    if (success) {
        return (
            <main style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ background: '#D1FAE5', color: '#065F46', padding: '32px', borderRadius: '16px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Registration Submitted!</h2>
                    <p style={{ fontSize: '1rem', lineHeight: 1.5 }}>
                        Jazakallah Khair! Your mosque has been successfully submitted to the platform.
                        It is currently pending approval by a platform administrator. Once approved, it will appear on the public map and you will be granted access to the management dashboard.
                    </p>
                </div>
                <button className="btn-primary" onClick={() => router.push('/')} style={{ width: '100%', maxWidth: '300px' }}>
                    Return to Homepage
                </button>
            </main>
        );
    }

    return (
        <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 600 }}>
                <ChevronLeft size={20} /> Back
            </button>

            <div style={{ background: 'var(--surface-color)', padding: '32px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Register Your Mosque</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: 1.5 }}>
                    Add your mosque to the Allahabad Salah Time Directory. Submissions are manually verified before appearing on the platform.
                </p>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Basic Info */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Mosque Name *</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input name="name" type="text" required placeholder="e.g. Jama Masjid" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Area / Neighborhood *</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input name="area" type="text" required placeholder="e.g. Chowk, Civil Lines" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Full Street Address *</label>
                        <textarea name="address" required placeholder="123 Example Street, Prayagraj, UP 211001" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)', minHeight: '80px', resize: 'vertical' }} />
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '8px 0' }} />

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Google Maps Link *</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>Paste a Google Maps link to automatically fill the exact coordinates.</p>
                        <div style={{ position: 'relative' }}>
                            <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="url"
                                name="google_maps_link"
                                required
                                placeholder="https://www.google.com/maps/..."
                                onChange={handleMapLinkPaste}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    outline: 'none',
                                    background: 'var(--bg-color)',
                                    opacity: isResolvingLink ? 0.6 : 1
                                }}
                                disabled={isResolvingLink}
                            />
                            {isResolvingLink && (
                                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                                    Resolving...
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Latitude (Optional)</label>
                            <input name="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 25.4358" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Longitude (Optional)</label>
                            <input name="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 81.8463" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-color)' }} />
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '8px 0' }} />

                    {/* Facilities Section */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Mosque Facilities</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input type="checkbox" name="wudu" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} />
                                <Droplets size={18} color="var(--primary-color)" /> Wudu Area
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input type="checkbox" name="womens" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} />
                                <Users size={18} color="var(--primary-color)" /> Women's Area
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input type="checkbox" name="ac" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} />
                                <Wind size={18} color="var(--primary-color)" /> Air Conditioning
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input type="checkbox" name="wheelchair" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} />
                                <Accessibility size={18} color="var(--primary-color)" /> Chair
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input type="checkbox" name="parking" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} />
                                <ParkingCircle size={18} color="var(--primary-color)" /> Parking
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input type="checkbox" name="library" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} />
                                <BookOpen size={18} color="var(--primary-color)" /> Library
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1rem' }}>
                        {loading ? 'Submitting Registration...' : 'Submit for Review'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        By submitting, you confirm the provided details are accurate.
                    </p>
                </form>
            </div>
        </main>
    );
}
