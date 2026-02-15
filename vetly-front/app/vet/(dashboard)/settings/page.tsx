'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useVetProfile, updateVetProfile, updateVetHours, uploadVetPhoto, DayHours } from '@/hooks/useVetData';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';

const defaultHours: Record<string, DayHours> = {
  monday: { open: '09:00', close: '21:00', closed: false },
  tuesday: { open: '09:00', close: '21:00', closed: false },
  wednesday: { open: '09:00', close: '21:00', closed: false },
  thursday: { open: '09:00', close: '21:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '14:00', closed: false },
  sunday: { open: '', close: '', closed: true },
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

export default function VetSettingsPage() {
  const { profile, loading, error, refetch } = useVetProfile();
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadVetPhoto(file);
      refetch();
      refreshUser();
    } catch {
      // silent
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
  });

  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    });
    if (profile.hours) {
      const merged: Record<string, DayHours> = {};
      for (const day of dayOrder) {
        const h = profile.hours[day];
        merged[day] = h
          ? { open: h.open || '', close: h.close || '', closed: h.closed ?? false }
          : defaultHours[day];
      }
      setHours(merged);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateVetProfile({
        name: formData.name,
        specialty: formData.specialty,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        description: formData.description,
      });
      await updateVetHours(hours);
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
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Ειδικότητα</label>
              <input
                type="text"
                value={formData.specialty}
                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Διεύθυνση</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Πόλη</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-600 mb-1">Περιγραφή</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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

        {/* Working Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ωράριο Λειτουργίας</h2>
          <div className="space-y-3">
            {dayOrder.map(day => {
              const schedule = hours[day];
              return (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-slate-700">{dayNames[day]}</span>
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
                  {!schedule.closed && (
                    <>
                      <input
                        type="time"
                        value={schedule.open || ''}
                        onChange={e =>
                          setHours({ ...hours, [day]: { ...schedule, open: e.target.value } })
                        }
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="time"
                        value={schedule.close || ''}
                        onChange={e =>
                          setHours({ ...hours, [day]: { ...schedule, close: e.target.value } })
                        }
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </>
                  )}
                  {schedule.closed && <span className="text-sm text-slate-400 italic">Κλειστά</span>}
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
            disabled={saving}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
          </button>
        </div>
      </div>
    </div>
  );
}
