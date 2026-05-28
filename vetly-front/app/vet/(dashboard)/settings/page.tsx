'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useVetProfile, updateVetProfile, updateVetHours, uploadVetPhoto, DayHours } from '@/hooks/useVetData';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';
import { VetMapPicker } from '@/components/MapView';

const TIME_OPTIONS: string[] = [];
for (let h = 6; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

const defaultHours: Record<string, DayHours> = {
  monday: { closed: false, morning: { open: '09:00', close: '14:00' }, afternoon: { open: '17:00', close: '21:00' } },
  tuesday: { closed: false, morning: { open: '09:00', close: '14:00' }, afternoon: { open: '17:00', close: '21:00' } },
  wednesday: { closed: false, morning: { open: '09:00', close: '14:00' }, afternoon: { open: '17:00', close: '21:00' } },
  thursday: { closed: false, morning: { open: '09:00', close: '14:00' }, afternoon: { open: '17:00', close: '21:00' } },
  friday: { closed: false, morning: { open: '09:00', close: '14:00' }, afternoon: { open: '17:00', close: '18:00' } },
  saturday: { closed: false, morning: { open: '10:00', close: '14:00' }, afternoon: null },
  sunday: { closed: true, morning: null, afternoon: null },
};

const dayNames: Record<string, string> = {
  monday: 'Δευτέρα',
  tuesday: 'Τρίτη',
  wednesday: 'Τετάρτη',
  thursday: 'Πέμπτη',
  friday: 'Παρασκευή',
  saturday: 'Σάββατο',
  sunday: 'Κυριακή',
};

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function LocationDialog({
  lat,
  lng,
  onSave,
  onClose,
}: {
  lat: number | null;
  lng: number | null;
  onSave: (lat: number | null, lng: number | null) => void;
  onClose: () => void;
}) {
  const [pickedLat, setPickedLat] = useState<number | null>(lat);
  const [pickedLng, setPickedLng] = useState<number | null>(lng);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Τοποθεσία Ιατρείου</h2>
            <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">Κάντε κλικ στον χάρτη για να ορίσετε τη θέση του ιατρείου σας.</p>
        </div>
        <div className="p-5">
          <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200">
            <VetMapPicker
              lat={pickedLat}
              lng={pickedLng}
              onChange={(newLat, newLng) => { setPickedLat(newLat); setPickedLng(newLng); }}
            />
          </div>
          {pickedLat && pickedLng && (
            <p className="text-xs text-slate-400 mt-2">
              Συντεταγμένες: {Number(pickedLat).toFixed(6)}, {Number(pickedLng).toFixed(6)}
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Ακύρωση
            </button>
            {pickedLat && pickedLng && (
              <button
                type="button"
                onClick={() => { setPickedLat(null); setPickedLng(null); }}
                className="py-3 px-4 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm"
              >
                Καθαρισμός
              </button>
            )}
            <button
              type="button"
              onClick={() => onSave(pickedLat, pickedLng)}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Αποθήκευση
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VetSettingsPage() {
  const { profile, loading, error, refetch } = useVetProfile();
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadVetPhoto(file);
      refetch();
      refreshUser();
    } catch {
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    description: '',
    licenseNumber: '',
    coordinates_lat: null as number | null,
    coordinates_lng: null as number | null,
  });

  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (formData.name.trim().length > 0 && formData.name.trim().length < 2)
    fieldErrors.name = 'Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.';
  else if (formData.name.length > 255)
    fieldErrors.name = 'Το όνομα δεν μπορεί να υπερβαίνει τους 255 χαρακτήρες.';
  if (formData.specialty.trim().length > 0 && formData.specialty.trim().length < 2)
    fieldErrors.specialty = 'Η ειδικότητα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.';
  if (formData.phone.trim().length > 0 && formData.phone.trim().length < 5)
    fieldErrors.phone = 'Το τηλέφωνο πρέπει να έχει τουλάχιστον 5 χαρακτήρες.';
  if (formData.address.trim().length > 0 && formData.address.trim().length < 5)
    fieldErrors.address = 'Η διεύθυνση πρέπει να έχει τουλάχιστον 5 χαρακτήρες.';
  if (formData.city.trim().length > 0 && formData.city.trim().length < 2)
    fieldErrors.city = 'Η πόλη πρέπει να έχει τουλάχιστον 2 χαρακτήρες.';
  if (formData.description.length > 2000)
    fieldErrors.description = 'Η περιγραφή δεν μπορεί να υπερβαίνει τους 2000 χαρακτήρες.';

  const hasErrors = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    if (!profile) return;
    setFormData({
      name: profile.name || '',
      specialty: profile.specialty || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      city: profile.city || '',
      description: profile.description || '',
      licenseNumber: profile.license_number || '',
      coordinates_lat: profile.coordinates_lat ?? null,
      coordinates_lng: profile.coordinates_lng ?? null,
    });
    if (profile.hours) {
      const merged: Record<string, DayHours> = {};
      for (const day of dayOrder) {
        const h = profile.hours[day] as unknown as Record<string, unknown> | undefined;
        if (!h) {
          merged[day] = defaultHours[day];
        } else {
          // Backward compatibility: old format with open/close -> treat as morning shift
          const morning = h.morning as { open: string; close: string } | null | undefined;
          const afternoon = h.afternoon as { open: string; close: string } | null | undefined;
          const oldOpen = h.open as string | null | undefined;
          const oldClose = h.close as string | null | undefined;
          if (morning || afternoon) {
            merged[day] = {
              closed: (h.closed as boolean) ?? false,
              morning: morning ? { open: morning.open, close: morning.close } : null,
              afternoon: afternoon ? { open: afternoon.open, close: afternoon.close } : null,
            };
          } else if (oldOpen && oldClose) {
            merged[day] = {
              closed: (h.closed as boolean) ?? false,
              morning: { open: oldOpen, close: oldClose },
              afternoon: null,
            };
          } else {
            merged[day] = { closed: (h.closed as boolean) ?? false, morning: null, afternoon: null };
          }
        }
      }
      setHours(merged);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setSaveError('Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      setSaving(false);
      return;
    }
    if (!formData.specialty.trim() || formData.specialty.trim().length < 2) {
      setSaveError('Η ειδικότητα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      setSaving(false);
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 5) {
      setSaveError('Το τηλέφωνο πρέπει να έχει τουλάχιστον 5 χαρακτήρες.');
      setSaving(false);
      return;
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      setSaveError('Η διεύθυνση πρέπει να έχει τουλάχιστον 5 χαρακτήρες.');
      setSaving(false);
      return;
    }
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      setSaveError('Η πόλη πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      setSaving(false);
      return;
    }

    // Convert to new shift format for backend
    const sanitizedHours: Record<string, DayHours> = {};
    for (const day of dayOrder) {
      const h = hours[day];
      if (h.closed) {
        sanitizedHours[day] = { closed: true, morning: null, afternoon: null };
      } else {
        sanitizedHours[day] = {
          closed: false,
          morning: h.morning?.open && h.morning?.close ? { open: h.morning.open, close: h.morning.close } : null,
          afternoon: h.afternoon?.open && h.afternoon?.close ? { open: h.afternoon.open, close: h.afternoon.close } : null,
        };
      }
    }

    try {
      await updateVetProfile({
        name: formData.name,
        specialty: formData.specialty,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        description: formData.description,
        coordinates_lat: formData.coordinates_lat,
        coordinates_lng: formData.coordinates_lng,
      });
      await updateVetHours(sanitizedHours);
      refetch();
      refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          &larr; Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Ρυθμίσεις Προφίλ</h1>
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Φωτογραφία Προφίλ</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              {profile?.image_url ? (
                <img src={getImageUrl(profile.image_url)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 font-bold text-3xl">{formData.name.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Μεταφόρτωση...' : 'Αλλαγή Φωτογραφίας'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <p className="text-sm text-slate-500 mt-2">JPG, PNG έως 5MB</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Βασικές Πληροφορίες</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Ονοματεπώνυμο</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={255}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => handleBlur('name')}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${touched.name && fieldErrors.name ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
              />
              {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Ειδικότητα</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={255}
                value={formData.specialty}
                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                onBlur={() => handleBlur('specialty')}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${touched.specialty && fieldErrors.specialty ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
              />
              {touched.specialty && fieldErrors.specialty && <p className="text-xs text-red-600 mt-1">{fieldErrors.specialty}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Τηλέφωνο</label>
              <input
                type="tel"
                required
                minLength={5}
                maxLength={50}
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                onBlur={() => handleBlur('phone')}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${touched.phone && fieldErrors.phone ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
              />
              {touched.phone && fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Διεύθυνση</label>
              <input
                type="text"
                required
                minLength={5}
                maxLength={500}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                onBlur={() => handleBlur('address')}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${touched.address && fieldErrors.address ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
              />
              {touched.address && fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Πόλη</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                onBlur={() => handleBlur('city')}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${touched.city && fieldErrors.city ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
              />
              {touched.city && fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-1">Περιγραφή</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                onBlur={() => handleBlur('description')}
                rows={3}
                maxLength={2000}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${touched.description && fieldErrors.description ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
              />
              <div className="flex justify-between mt-1">
                {touched.description && fieldErrors.description ? <p className="text-xs text-red-600">{fieldErrors.description}</p> : <span />}
                <span className="text-xs text-slate-400">{formData.description.length}/2000</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Αριθμός Άδειας</label>
              <input
                type="text"
                value={formData.licenseNumber}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Τοποθεσία Ιατρείου</h2>
              {formData.coordinates_lat && formData.coordinates_lng ? (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ορισμένη ({Number(formData.coordinates_lat).toFixed(4)}, {Number(formData.coordinates_lng).toFixed(4)})
                </p>
              ) : (
                <p className="text-sm text-slate-400 mt-1">Δεν έχει οριστεί τοποθεσία.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowLocationDialog(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {formData.coordinates_lat ? 'Αλλαγή Τοποθεσίας' : 'Ορισμός Τοποθεσίας'}
            </button>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ωράριο Λειτουργίας</h2>
          <div className="space-y-4">
            {dayOrder.map(day => {
              const schedule = hours[day];
              const hasAfternoon = !!schedule.afternoon;
              return (
                <div key={day} className="border border-slate-100 rounded-xl p-3">
                  <div className="mb-3 flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="min-w-0 flex-1 text-sm font-bold text-slate-700 sm:w-24 sm:flex-none sm:font-medium">{dayNames[day]}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!schedule.closed}
                        onChange={() =>
                          setHours({ ...hours, [day]: { ...schedule, closed: !schedule.closed } })
                        }
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600">Ανοιχτά</span>
                    </label>
                    {schedule.closed && <span className="text-sm text-slate-400 italic">Κλειστά</span>}
                  </div>
                  {!schedule.closed && (
                    <div className="space-y-3 sm:ml-28 sm:space-y-2">
                      {/* Morning shift */}
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-xs font-medium text-slate-500 sm:w-20">Πρωί</span>
                        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:w-auto">
                          <select
                            value={schedule.morning?.open || ''}
                            onChange={e => setHours({ ...hours, [day]: { ...schedule, morning: { open: e.target.value, close: schedule.morning?.close || '' } } })}
                            className="min-w-0 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-24 sm:py-1.5"
                          >
                            <option value="">--:--</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-slate-400">-</span>
                          <select
                            value={schedule.morning?.close || ''}
                            onChange={e => setHours({ ...hours, [day]: { ...schedule, morning: { open: schedule.morning?.open || '', close: e.target.value } } })}
                            className="min-w-0 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-24 sm:py-1.5"
                          >
                            <option value="">--:--</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      {/* Afternoon shift */}
                      {hasAfternoon ? (
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                          <span className="text-xs font-medium text-slate-500 sm:w-20">Απόγευμα</span>
                          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 sm:w-auto">
                            <select
                              value={schedule.afternoon?.open || ''}
                              onChange={e => setHours({ ...hours, [day]: { ...schedule, afternoon: { open: e.target.value, close: schedule.afternoon?.close || '' } } })}
                              className="min-w-0 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-24 sm:py-1.5"
                            >
                              <option value="">--:--</option>
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-slate-400">-</span>
                            <select
                              value={schedule.afternoon?.close || ''}
                              onChange={e => setHours({ ...hours, [day]: { ...schedule, afternoon: { open: schedule.afternoon?.open || '', close: e.target.value } } })}
                              className="min-w-0 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-24 sm:py-1.5"
                            >
                              <option value="">--:--</option>
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          <button
                            type="button"
                            onClick={() => setHours({ ...hours, [day]: { ...schedule, afternoon: null } })}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:ml-1"
                            title="Αφαίρεση απογευματινού"
                            aria-label="Αφαίρεση απογευματινού"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHours({ ...hours, [day]: { ...schedule, afternoon: { open: '17:00', close: '21:00' } } })}
                          className="flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-800 sm:w-fit sm:justify-start sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Προσθήκη απογευματινού ωραρίου
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Feedback */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-medium">{saveError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-medium">Οι αλλαγές αποθηκεύτηκαν επιτυχώς!</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
          </button>
        </div>
      </div>

      {showLocationDialog && (
        <LocationDialog
          lat={formData.coordinates_lat}
          lng={formData.coordinates_lng}
          onSave={(lat, lng) => {
            setFormData({ ...formData, coordinates_lat: lat, coordinates_lng: lng });
            setShowLocationDialog(false);
          }}
          onClose={() => setShowLocationDialog(false)}
        />
      )}
    </div>
  );
}
