// frontend/src/components/EmergencyPharmacy.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issues for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Define custom icons using the new SVG file names
const houseIcon = L.icon({
    iconUrl: '/house_icon.svg',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

const pharmacyIcon = L.icon({
    iconUrl: '/pharmacy_icon.svg',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

interface PharmacyEntry {
    id: string;
    from: string;
    to: string;
    name: string;
    street: string;
    zipCode: string;
    location: string;
    phone: string;
    lat: string; // provided as string in XML, will be parsed to number
    lon: string;
    distance?: string; // computed distance in kilometers
}

// Helper function to format open time details as "formattedFrom – formattedTo"
const formatNotdienstDates = (from: string, to: string): string => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const pad = (num: number) => num.toString().padStart(2, '0');
    const formattedFrom = `${pad(fromDate.getDate())}.${pad(fromDate.getMonth() + 1)}.${fromDate.getFullYear()}, ${fromDate.getHours()}:${pad(fromDate.getMinutes())} Uhr`;
    const formattedTo = `${pad(toDate.getDate())}.${pad(toDate.getMonth() + 1)}.${toDate.getFullYear()}, ${toDate.getHours()}:${pad(toDate.getMinutes())} Uhr`;
    return `${formattedFrom} – ${formattedTo}`;
};

const EmergencyPharmacy: React.FC = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [pharmacies, setPharmacies] = useState<PharmacyEntry[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyEntry | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Request user's location via the browser's Geolocation API
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                },
                (err) => {
                    console.error('Error getting location:', err);
                    setError('Unable to retrieve your location.');
                }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
        }
    };

    // Fetch pharmacy data from the backend API
    const fetchPharmacyData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3001/api/pharmacies');
            // Assuming the data structure is { container: { entries: { entry: PharmacyEntry[] } } }
            const entries = response.data?.container?.entries?.entry;
            if (Array.isArray(entries)) {
                setPharmacies(entries);
            } else if (entries) {
                setPharmacies([entries]);
            } else {
                setError('No pharmacy data found.');
            }
        } catch (err) {
            console.error('Error fetching pharmacy data:', err);
            setError('Failed to fetch pharmacy data.');
        } finally {
            setLoading(false);
        }
    };

    // Haversine formula to compute distance (in kilometers) between two lat/lon pairs
    const computeDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (x: number) => (x * Math.PI) / 180;
        const R = 6371; // Earth's radius in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Memoize function to select the nearest open pharmacy
    const findNextOpenPharmacy = useCallback(() => {
        const now = new Date();
        const openPharmacies = pharmacies.filter((pharmacy) => {
            const fromTime = new Date(pharmacy.from);
            const toTime = new Date(pharmacy.to);
            return now >= fromTime && now <= toTime;
        });
        if (!openPharmacies.length) return null;
        if (userLocation) {
            openPharmacies.forEach((pharmacy) => {
                pharmacy.distance = computeDistance(
                    userLocation.lat,
                    userLocation.lon,
                    parseFloat(pharmacy.lat),
                    parseFloat(pharmacy.lon)
                ).toFixed(2);
            });
            openPharmacies.sort((a, b) => parseFloat(a.distance || '0') - parseFloat(b.distance || '0'));
        }
        return openPharmacies[0];
    }, [pharmacies, userLocation]);

    // On component mount, fetch pharmacy data
    useEffect(() => {
        fetchPharmacyData();
    }, []);

    // Update selected pharmacy when data or location changes
    useEffect(() => {
        if (userLocation) {
            const pharmacy = findNextOpenPharmacy();
            setSelectedPharmacy(pharmacy);
        }
    }, [pharmacies, userLocation, findNextOpenPharmacy]);

    // MapView component shows the light, contrasted map with markers for the user and the nearest pharmacy
    const MapView: React.FC<{ userLocation: { lat: number; lon: number }; pharmacy: PharmacyEntry }> = ({
        userLocation,
        pharmacy,
    }) => {
        const center: [number, number] = [userLocation.lat, userLocation.lon];
        return (
            <MapContainer center={center} zoom={13} style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[userLocation.lat, userLocation.lon]} icon={houseIcon}>
                    <Popup>Ihr Standort</Popup>
                </Marker>
                <Marker position={[parseFloat(pharmacy.lat), parseFloat(pharmacy.lon)]} icon={pharmacyIcon}>
                    <Popup>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{pharmacy.name}</h3>
                            <p>
                                <strong>Adresse:</strong> {pharmacy.street}, {pharmacy.zipCode} {pharmacy.location}
                            </p>
                            <p>
                                <strong>Telefon:</strong> {pharmacy.phone}
                            </p>
                            <div style={{ textAlign: 'center', display: 'inline-block', padding: '0 5px' }}>
                                <strong>Schichtzeit:</strong> {formatNotdienstDates(pharmacy.from, pharmacy.to)}
                            </div>
                            <p style={{ textAlign: 'center' }}>
                                <strong>Entfernung:</strong> {pharmacy.distance} km
                            </p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        );
    };

    return (
        <div
            style={{
                padding: '2rem',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#f0f8ff',
                minHeight: '100vh',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img src="/logo.svg" alt="Logo" style={{ width: '120px', height: '120px' }} />
            </div>
            <h1 style={{ color: '#007BFF', textAlign: 'center' }}>Ihr nächster Apothekennotdienst:</h1>

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {loading && <p style={{ textAlign: 'center' }}>Loading pharmacy data...</p>}

            {!userLocation && !error && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        Bitte genehmigen Sie den Zugriff auf Ihren Standort, um den nächsten Apothekennotdienst zu finden.
                    </p>
                    <button
                        onClick={getUserLocation}
                        style={{
                            backgroundColor: '#007BFF',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Zugriff genehmigen
                    </button>
                </div>
            )}

            {userLocation && selectedPharmacy && (
                <div
                    style={{
                        border: '2px solid #007BFF',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginTop: '1rem',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        width: 'auto',
                        margin: '1rem auto',
                    }}
                >
                    <h2 style={{ color: '#007BFF', textAlign: 'center' }}>{selectedPharmacy.name}</h2>
                    <p style={{ textAlign: 'center' }}>
                        <strong>Adresse:</strong> {selectedPharmacy.street}, {selectedPharmacy.zipCode} {selectedPharmacy.location}
                    </p>
                    <p style={{ textAlign: 'center' }}>
                        <strong>Telefon:</strong> {selectedPharmacy.phone}
                    </p>
                    <div style={{ textAlign: 'center', display: 'inline-block', padding: '0 5px' }}>
                        <strong>Schichtzeit:</strong> {formatNotdienstDates(selectedPharmacy.from, selectedPharmacy.to)}
                    </div>
                    <p style={{ textAlign: 'center' }}>
                        <strong>Entfernung:</strong> {selectedPharmacy.distance} km
                    </p>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button
                            onClick={fetchPharmacyData}
                            style={{
                                backgroundColor: '#007BFF',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Daten aktualisieren
                        </button>
                    </div>
                </div>
            )}

            {userLocation && selectedPharmacy && <MapView userLocation={userLocation} pharmacy={selectedPharmacy} />}
        </div>
    );
};

export default EmergencyPharmacy;
