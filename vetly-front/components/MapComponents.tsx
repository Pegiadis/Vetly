'use client';

import { useEffect, useRef } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Copied into public/ by scripts/copy-map-worker.mjs (bundling moves the library away from its worker file).
setWorkerUrl('/vendor/maplibre-gl-worker.mjs');

/*
 * Vector maps with MapLibre. Tiles come from OpenFreeMap (free, no key, commercial use allowed;
 * OpenStreetMap data). To self-host later (e.g. Protomaps), only MAP_STYLE changes.
 */
const MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';

// Default center: Thessaloniki, as before. [lng, lat] order for MapLibre.
const THESSALONIKI: [number, number] = [22.9474, 40.6301];
const DEFAULT_ZOOM = 12;

// Clinic palette (globals.css).
const CLINIC_600 = '#006064';
const CLINIC_100 = '#def5ed';
const ON_CALL = '#047857';

/** Softens the base style toward the Vetly palette. Layer ids differ per style, so missing ones are skipped. */
function applyPalette(map: MapLibreMap) {
  const paint: [string, Parameters<MapLibreMap['setPaintProperty']>[1], string][] = [
    ['water', 'fill-color', '#bfe1dd'],
    ['park', 'fill-color', '#dcefe2'],
    ['landcover_wood', 'fill-color', '#dcefe2'],
    ['background', 'background-color', '#f6f8f7'],
  ];
  for (const [layer, property, value] of paint) {
    if (map.getLayer(layer)) {
      try { map.setPaintProperty(layer, property, value); } catch { /* property not used by this layer */ }
    }
  }
  // Labels in Greek only: the base style shows the local name plus a Latin transliteration.
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field') !== undefined) {
      map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:el'], ['get', 'name'], ['get', 'name:latin']]);
    }
  }
}

function createMap(container: HTMLElement, center: [number, number], zoom: number) {
  const map = new MapLibreMap({
    container,
    style: MAP_STYLE,
    center,
    zoom,
    attributionControl: { compact: true },
    cooperativeGestures: true, // one finger scrolls the page on phones; two fingers move the map
  });
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
  map.on('style.load', () => applyPalette(map));
  return map;
}

/** A round pin in the clinic colour. Built with the DOM so vet names never become HTML. */
function pinElement(color: string, label: string) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'vetly-pin';
  el.setAttribute('aria-label', label);
  el.style.setProperty('--pin', color);
  el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.5 7.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm7 0a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5ZM5 11.25a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm14 0a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5ZM12 10c2.6 0 5.25 3.4 5.25 5.9 0 1.7-1.3 2.6-2.7 2.6-.95 0-1.6-.45-2.55-.45s-1.6.45-2.55.45c-1.4 0-2.7-.9-2.7-2.6C6.75 13.4 9.4 10 12 10Z"/></svg>';
  return el;
}

interface PopupVet {
  name: string;
  specialty: string;
  address: string | null;
  rating_average: number;
  reviews_count: number;
  lat: number;
  lng: number;
  phone?: string;
}

function popupContent(vet: PopupVet) {
  const root = document.createElement('div');
  root.className = 'vetly-popup';
  const line = (tag: string, text: string, className: string) => {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    root.appendChild(el);
    return el;
  };
  line('strong', vet.name, 'vetly-popup-title');
  line('span', vet.specialty, 'vetly-popup-muted');
  if (vet.address) line('span', vet.address, 'vetly-popup-muted');
  if (vet.reviews_count > 0) {
    line('span', `★ ${Number(vet.rating_average).toFixed(1).replace('.', ',')} · ${vet.reviews_count} ${vet.reviews_count === 1 ? 'αξιολόγηση' : 'αξιολογήσεις'}`, 'vetly-popup-text');
  }
  const links = document.createElement('div');
  links.className = 'vetly-popup-links';
  if (vet.phone) {
    const call = document.createElement('a');
    call.href = `tel:${vet.phone}`;
    call.textContent = `Κλήση ${vet.phone}`;
    links.appendChild(call);
  }
  const directions = document.createElement('a');
  directions.href = `https://www.google.com/maps/dir/?api=1&destination=${vet.lat},${vet.lng}`;
  directions.target = '_blank';
  directions.rel = 'noopener noreferrer';
  directions.textContent = 'Οδηγίες';
  links.appendChild(directions);
  root.appendChild(links);
  return root;
}

// --- Markers for a list of vets (booking and on-call) ---

interface MarkerVet extends PopupVet { id: string }

function VetMarkersMap<T extends MarkerVet>({ vets, selectedVetId, onSelectVet, color }: {
  vets: T[]; selectedVetId: string | null; onSelectVet: (id: string) => void; color: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLElement }>());
  const select = useRef(onSelectVet);
  select.current = onSelectVet;

  useEffect(() => {
    if (!container.current) return;
    const map = createMap(container.current, THESSALONIKI, DEFAULT_ZOOM);
    mapRef.current = map;
    const existing = markers.current;
    return () => { existing.clear(); map.remove(); mapRef.current = null; };
  }, []);

  // Rebuild markers only when the vets or their positions change. Parents pass a new array on every
  // render (e.g. after a selection); rebuilding then would close the popup the click just opened.
  const vetsKey = vets.map(vet => `${vet.id}:${vet.lat}:${vet.lng}`).join('|');
  const latestVets = useRef(vets);
  latestVets.current = vets;
  useEffect(() => {
    const vets = latestVets.current;
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach(({ marker }) => marker.remove());
    markers.current.clear();
    const bounds = new LngLatBounds();
    for (const vet of vets) {
      const el = pinElement(color, vet.name);
      const popup = new Popup({ offset: 22, closeButton: false, maxWidth: '240px' }).setDOMContent(popupContent(vet));
      const marker = new Marker({ element: el, anchor: 'bottom' }).setLngLat([vet.lng, vet.lat]).setPopup(popup).addTo(map);
      el.addEventListener('click', () => select.current(vet.id));
      markers.current.set(vet.id, { marker, el });
      bounds.extend([vet.lng, vet.lat]);
    }
    if (vets.length === 1) map.jumpTo({ center: [vets[0].lng, vets[0].lat], zoom: 14 });
    else if (vets.length > 1) map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
  }, [vetsKey, color]);

  // Highlight and fly to the selected vet.
  useEffect(() => {
    markers.current.forEach(({ el }, id) => el.classList.toggle('is-selected', id === selectedVetId));
    const entry = selectedVetId ? markers.current.get(selectedVetId) : undefined;
    if (entry && mapRef.current) mapRef.current.flyTo({ center: entry.marker.getLngLat(), zoom: 14, duration: 500 });
  }, [selectedVetId, vetsKey]);

  return <div ref={container} className="vetly-map h-full w-full overflow-hidden rounded-xl" />;
}

// --- VetSearchMap: owner booking ---

interface VetSearchMapProps {
  vets: MarkerVet[];
  selectedVetId: string | null;
  onSelectVet: (id: string) => void;
}

export function VetSearchMapInner(props: VetSearchMapProps) {
  return <VetMarkersMap {...props} color={CLINIC_600} />;
}

// --- OnCallMap: owner emergency page ---

export interface OnCallVetMarker {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  address: string;
  rating_average: number;
  reviews_count: number;
  lat: number;
  lng: number;
}

interface OnCallMapProps {
  vets: OnCallVetMarker[];
  selectedVetId: string | null;
  onSelectVet: (id: string) => void;
}

export function OnCallMapInner(props: OnCallMapProps) {
  return <VetMarkersMap {...props} color={ON_CALL} />;
}

// --- VetMapPicker: vet settings, click to place the clinic ---

interface VetMapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function VetMapPickerInner({ lat, lng, onChange }: VetMapPickerProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const change = useRef(onChange);
  change.current = onChange;

  useEffect(() => {
    if (!container.current) return;
    const placed = lat != null && lng != null;
    const map = createMap(container.current, placed ? [lng, lat] : THESSALONIKI, placed ? 15 : DEFAULT_ZOOM);
    map.on('click', event => change.current(event.lngLat.lat, event.lngLat.lng));
    map.getCanvas().style.cursor = 'crosshair';
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; marker.current = null; };
    // The map is created once; later position changes move the marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat == null || lng == null) { marker.current?.remove(); marker.current = null; return; }
    if (!marker.current) {
      const el = pinElement(CLINIC_600, 'Τοποθεσία ιατρείου');
      el.classList.add('is-selected');
      marker.current = new Marker({ element: el, anchor: 'bottom', draggable: true }).setLngLat([lng, lat]).addTo(map);
      marker.current.on('dragend', () => {
        const point = marker.current?.getLngLat();
        if (point) change.current(point.lat, point.lng);
      });
    } else {
      marker.current.setLngLat([lng, lat]);
    }
  }, [lat, lng]);

  return <div ref={container} className="vetly-map h-full w-full overflow-hidden rounded-xl" style={{ background: CLINIC_100 }} />;
}
