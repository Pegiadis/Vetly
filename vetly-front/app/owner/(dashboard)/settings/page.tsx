'use client';

import { useState, useEffect, useRef } from 'react';
import { useOwnerProfile, updateOwnerProfile, uploadOwnerPhoto } from '@/hooks/useOwnerData';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';

export default function SettingsPage() {
  const { profile, loading, error, refetch } = useOwnerProfile();
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadOwnerPhoto(file);
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
    email: '',
    phone: '',
    address: '',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vetly_notification_prefs');
        if (saved) return JSON.parse(saved);
      } catch { /* use defaults */ }
    }
    return { appointments: true, medications: true, marketing: false };
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const fieldErrors: Record<string, string> = {};
  if (formData.name.length > 0 && formData.name.trim().length < 2) fieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';

  const inputErr = (field: string) => touched[field] && fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-slate-200';
  const hasErrors = Object.keys(fieldErrors).length > 0;

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev: typeof notifications) => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('vetly_notification_prefs', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  };

  const handleSave = async () => {
    if (hasErrors) {
      setSaveError('Διορθώστε τα σφάλματα πριν αποθηκεύσετε.');
      return;
    }
    if (formData.name && formData.name.trim().length < 2) {
      setSaveError('Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      await updateOwnerProfile({
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
      refetch();
      refreshUser();
      setSaveSuccess(true);
    } catch {
      alert('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSaving(false);
    }
  };

  const initials = formData.name
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ρυθμίσεις</h1>
        <p className="text-slate-500 mt-1">Διαχειριστείτε το προφίλ και τις προτιμήσεις σας.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Προφίλ</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 text-2xl font-bold overflow-hidden">
            {profile?.image_url ? (
              <img src={getImageUrl(profile.image_url)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials || '?'
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
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
            <p className="text-xs text-slate-500 mt-2">JPG, PNG. Μέγιστο 2MB.</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Ονοματεπώνυμο</label>
            <input
              type="text"
              name="name"
              maxLength={255}
              minLength={2}
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${inputErr('name')}`}
            />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Τηλέφωνο</label>
            <input
              type="tel"
              name="phone"
              maxLength={50}
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Διεύθυνση</label>
            <input
              type="text"
              name="address"
              maxLength={500}
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
          </button>
          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">Οι αλλαγές αποθηκεύτηκαν!</span>
          )}
          {saveError && (
            <span className="text-sm text-red-600 font-medium">{saveError}</span>
          )}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Ειδοποιήσεις</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Υπενθυμίσεις Ραντεβού</p>
              <p className="text-sm text-slate-500">Λήψη ειδοποιήσεων για τα επερχόμενα ραντεβού</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.appointments}
                onChange={() => handleNotificationChange('appointments')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Υπενθυμίσεις Φαρμάκων</p>
              <p className="text-sm text-slate-500">Λήψη ειδοποιήσεων για τη χορήγηση φαρμάκων</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.medications}
                onChange={() => handleNotificationChange('medications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-bold text-slate-800">Ενημερωτικά Δελτία</p>
              <p className="text-sm text-slate-500">Λήψη προσφορών και νέων από το Vetly</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.marketing}
                onChange={() => handleNotificationChange('marketing')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
            </label>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Ασφάλεια</h2>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">Αλλαγή Κωδικού</p>
                <p className="text-sm text-slate-500">Ενημερώστε τον κωδικό πρόσβασής σας</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">Διαχείριση Συσκευών</p>
                <p className="text-sm text-slate-500">Δείτε τις συνδεδεμένες συσκευές</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
        <h2 className="text-lg font-bold text-red-600 mb-4">Διαγραφή Λογαριασμού</h2>
        <p className="text-sm text-slate-600 mb-4">
          Η διαγραφή του λογαριασμού σας είναι μόνιμη και δεν μπορεί να αναιρεθεί.
          Όλα τα δεδομένα σας θα διαγραφούν.
        </p>
        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
          Διαγραφή Λογαριασμού
        </button>
      </div>
    </div>
  );
}
