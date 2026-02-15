'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [0, -46],
  shadowSize: [41, 41],
  className: 'selected-marker',
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default center: Thessaloniki
const THESSALONIKI_CENTER: [number, number] = [40.6301, 22.9474];
const DEFAULT_ZOOM = 12;

// --- VetMapPicker: for vet settings ---

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface VetMapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function VetMapPickerInner({ lat, lng, onChange }: VetMapPickerProps) {
  const center: [number, number] = lat && lng ? [lat, lng] : THESSALONIKI_CENTER;

  return (
    <MapContainer center={center} zoom={lat && lng ? 15 : DEFAULT_ZOOM} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }} attributionControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onChange} />
      {lat && lng && <Marker position={[lat, lng]} />}
    </MapContainer>
  );
}

// --- VetSearchMap: for owner booking ---

interface VetMarker {
  id: string;
  name: string;
  specialty: string;
  rating_average: number;
  reviews_count: number;
  address: string | null;
  lat: number;
  lng: number;
}

function FlyToSelected({ selectedId, markers }: { selectedId: string | null; markers: VetMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const marker = markers.find(m => m.id === selectedId);
    if (marker) {
      map.flyTo([marker.lat, marker.lng], 14, { duration: 0.5 });
    }
  }, [selectedId, markers, map]);

  return null;
}

interface VetSearchMapProps {
  vets: VetMarker[];
  selectedVetId: string | null;
  onSelectVet: (id: string) => void;
}

export function VetSearchMapInner({ vets, selectedVetId, onSelectVet }: VetSearchMapProps) {
  return (
    <MapContainer center={THESSALONIKI_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }} attributionControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected selectedId={selectedVetId} markers={vets} />
      {vets.map((vet) => (
        <Marker
          key={vet.id}
          position={[vet.lat, vet.lng]}
          icon={selectedVetId === vet.id ? selectedIcon : defaultIcon}
          eventHandlers={{ click: () => onSelectVet(vet.id) }}
        >
          <Popup>
            <div style={{ minWidth: 150 }}>
              <strong style={{ fontSize: 14 }}>{vet.name}</strong>
              <br />
              <span style={{ fontSize: 12, color: '#64748b' }}>{vet.specialty}</span>
              <br />
              {vet.address && (
                <>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{vet.address}</span>
                  <br />
                </>
              )}
              <span style={{ fontSize: 12 }}>
                ⭐ {Number(vet.rating_average).toFixed(1)} ({vet.reviews_count})
              </span>
              <br />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${vet.lat},${vet.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Οδηγίες Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
