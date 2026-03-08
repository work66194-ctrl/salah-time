'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';

// Fix Leaflet icons in Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// User location marker
const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapProps {
    mosques: any[];
    height?: string;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MosqueMap({ mosques, height = '600px' }: MapProps) {
    const router = useRouter();

    // Allahabad Center Coordinates
    const ALLAHABAD_CENTER: [number, number] = [25.4358, 81.8463];
    const [center, setCenter] = useState<[number, number]>(ALLAHABAD_CENTER);
    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

    const locateUser = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCenter([latitude, longitude]);
                    setUserLoc([latitude, longitude]);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    };

    useEffect(() => {
        locateUser();
    }, []);

    return (
        <div style={{ position: 'relative', height, width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', zIndex: 0 }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={center} zoom={13} />

                {userLoc && (
                    <Marker position={userLoc} icon={userIcon}>
                        <Popup>
                            <div style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                                You are here
                            </div>
                        </Popup>
                    </Marker>
                )}

                {mosques.map((mosque) => (
                    mosque.latitude && mosque.longitude ? (
                        <Marker key={mosque.id} position={[mosque.latitude, mosque.longitude]} icon={icon}>
                            <Popup>
                                <div style={{ padding: '8px' }}>
                                    <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{mosque.name}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>{mosque.area}</p>
                                    <button
                                        onClick={() => router.push(`/mosques/${mosque.id}`)}
                                        style={{ background: 'var(--primary-color)', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: 'none', width: '100%' }}
                                    >
                                        View Timings
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                ))}
            </MapContainer>

            {/* Locate Me Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    locateUser();
                }}
                title="Locate Me"
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    background: 'white',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
                    padding: '8px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)' }}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>
        </div>
    );
}
