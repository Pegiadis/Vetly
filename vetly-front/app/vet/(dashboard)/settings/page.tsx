'use client';


import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { ClinicButton, ClinicInput, ClinicPanel, ClinicSelect, ClinicPageHeader } from '@/components/vet/ClinicUI';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useVetProfile, updateVetProfile, updateVetHours, uploadVetPhoto, changeVetPassword, logoutVetEverywhere, DayHours } from '@/hooks/useVetData';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';
import { VetMapPicker } from '@/components/MapView';

function ProfileSection({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-24 gap-4 border-t border-ink-200 pt-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
    <div><h2 id={`${id}-title`} className="text-sm font-semibold text-ink-900">{title}</h2><p className="mt-2 max-w-sm text-xs leading-5 text-ink-500">{description}</p></div>
    <ClinicPanel className="min-w-0 overflow-hidden p-4 sm:p-5">{children}</ClinicPanel>
  </section>;
}

function SecuritySection() {
  const { login } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState<'password' | 'logout' | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const mismatch = confirmPassword !== '' && confirmPassword !== newPassword;
  const tooShort = newPassword !== '' && newPassword.length < 8;

  // The response carries a fresh token so this device stays signed in while the others are revoked.
  const run = async (kind: 'password' | 'logout', action: () => Promise<{ access_token: string }>, success: string) => {
    setBusy(kind);
    setMessage(null);
    try {
      const response = await action();
      await login(response.access_token, 'vet');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ kind: 'success', text: success });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error && err.message ? err.message : 'Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.' });
    } finally {
      setBusy(null);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (tooShort || mismatch || !currentPassword || !newPassword) return;
    run('password', () => changeVetPassword(currentPassword, newPassword), 'Ο κωδικός άλλαξε. Οι υπόλοιπες συσκευές αποσυνδέθηκαν.');
  };

  const handleLogoutAll = () => {
    if (!currentPassword) {
      setMessage({ kind: 'error', text: 'Εισάγετε τον τρέχοντα κωδικό σας για να συνεχίσετε.' });
      return;
    }
    run('logout', () => logoutVetEverywhere(currentPassword), 'Αποσυνδεθήκατε από όλες τις άλλες συσκευές.');
  };

  return (
    <ProfileSection id="account-security" title="Ασφάλεια" description="Αλλάξτε τον κωδικό πρόσβασης ή αποσυνδεθείτε από όλες τις συσκευές. Αυτή η συσκευή παραμένει συνδεδεμένη.">
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="security-current" className="block text-xs font-medium text-ink-700 mb-1.5">Τρέχων κωδικός</label>
          <ClinicInput id="security-current" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="security-new" className="block text-xs font-medium text-ink-700 mb-1.5">Νέος κωδικός</label>
            <ClinicInput id="security-new" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            {tooShort && <p className="text-xs text-red-600 mt-1">Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.</p>}
          </div>
          <div>
            <label htmlFor="security-confirm" className="block text-xs font-medium text-ink-700 mb-1.5">Επιβεβαίωση νέου κωδικού</label>
            <ClinicInput id="security-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            {mismatch && <p className="text-xs text-red-600 mt-1">Οι κωδικοί δεν ταυτίζονται.</p>}
          </div>
        </div>
        {message && (
          <div role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${message.kind === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {message.text}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ClinicButton variant="primary" type="submit" disabled={busy !== null || !currentPassword || !newPassword || !confirmPassword || tooShort || mismatch} className="disabled:opacity-50">
            {busy === 'password' ? 'Αποθήκευση...' : 'Αλλαγή κωδικού'}
          </ClinicButton>
          <ClinicButton variant="danger" type="button" onClick={handleLogoutAll} disabled={busy !== null} className="disabled:opacity-50">
            {busy === 'logout' ? 'Αποσύνδεση...' : 'Αποσύνδεση από όλες τις συσκευές'}
          </ClinicButton>
        </div>
        <p className="text-xs text-ink-500">Η αποσύνδεση από όλες τις συσκευές χρησιμοποιεί τον τρέχοντα κωδικό που έχετε εισάγει παραπάνω.</p>
      </form>
    </ProfileSection>
  );
}

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
    <ClinicDrawer label="Τοποθεσία Ιατρείου" onClose={onClose}>
      <div className="relative min-h-full bg-white shadow-xl w-full">
        <div className="border-b border-ink-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-900">Τοποθεσία Ιατρείου</h2>
            <ClinicButton variant="secondary" onClick={onClose} aria-label="Κλείσιμο τοποθεσίας" className="backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </ClinicButton>
          </div>
          <p className="text-ink-500 text-sm mt-1">Κάντε κλικ στον χάρτη για να ορίσετε τη θέση του ιατρείου σας.</p>
        </div>
        <div className="p-5">
          <div className="h-[400px] rounded-xl overflow-hidden border border-ink-200">
            <VetMapPicker
              lat={pickedLat}
              lng={pickedLng}
              onChange={(newLat, newLng) => { setPickedLat(newLat); setPickedLng(newLng); }}
            />
          </div>
          {pickedLat && pickedLng && (
            <p className="text-xs text-ink-400 mt-2">
              Συντεταγμένες: {Number(pickedLat).toFixed(6)}, {Number(pickedLng).toFixed(6)}
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <ClinicButton variant="secondary"
              type="button"
              onClick={onClose}
              className="flex-1"
            >
              Ακύρωση
            </ClinicButton>
            {pickedLat && pickedLng && (
              <ClinicButton variant="danger"
                type="button"
                onClick={() => { setPickedLat(null); setPickedLng(null); }}
                className=""
              >
                Καθαρισμός
              </ClinicButton>
            )}
            <ClinicButton variant="primary"
              type="button"
              onClick={() => onSave(pickedLat, pickedLng)}
              className="flex-1"
            >
              Αποθήκευση
            </ClinicButton>
          </div>
        </div>
      </div>
    </ClinicDrawer>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <ClinicPageHeader title="Προφίλ κτηνιατρείου" description="Η επαγγελματική σας παρουσία και οι ώρες που δέχεστε ραντεβού." />
      <nav aria-label="Ενότητες προφίλ" className="mb-6 flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-white p-2">
        {[['profile-photo', 'Εικόνα'], ['profile-details', 'Στοιχεία'], ['clinic-location', 'Τοποθεσία'], ['working-hours', 'Ωράριο'], ['account-security', 'Ασφάλεια']].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-md px-3 py-2 text-xs font-medium text-ink-700 hover:bg-clinic-50 focus-visible:outline-2 focus-visible:outline-clinic-600">{label}</a>)}
      </nav>

      <div className="space-y-6">
        {/* Profile Photo */}
        <ProfileSection id="profile-photo" title="Εικόνα προφίλ" description="Η φωτογραφία που συνοδεύει το προφίλ σας στο Vetly. Η αλλαγή φωτογραφίας αποθηκεύεται αμέσως.">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-lg bg-clinic-100 flex items-center justify-center overflow-hidden">
              {profile?.image_url ? (
                <img src={getImageUrl(profile.image_url)} alt="Φωτογραφία κτηνιάτρου" className="w-full h-full object-cover" />
              ) : (
                <span className="text-clinic-600 font-semibold text-3xl">{formData.name.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-1 break-words text-sm font-semibold text-ink-900">{profile?.name}</p>
              <p className="mb-3 text-xs text-ink-500">{profile?.specialty}</p>
              <ClinicButton variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="disabled:opacity-50"
              >
                {uploading ? 'Μεταφόρτωση...' : 'Αλλαγή Φωτογραφίας'}
              </ClinicButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <p className="text-sm text-ink-500 mt-2">JPG, PNG έως 5MB</p>
            </div>
          </div>
        </ProfileSection>

        {/* Basic Info */}
        <ProfileSection id="profile-details" title="Στοιχεία κτηνιατρείου" description="Διαχειριστείτε τα επαγγελματικά στοιχεία, την επικοινωνία και την περιγραφή σας. Το email και ο αριθμός άδειας δεν αλλάζουν από εδώ.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-ink-700 mb-1.5">Ονοματεπώνυμο</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={255}
                id="profile-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => handleBlur('name')}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${touched.name && fieldErrors.name ? 'border-red-300 bg-red-50/30' : 'border-ink-200'}`}
              />
              {touched.name && fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="profile-specialty" className="block text-xs font-medium text-ink-700 mb-1.5">Ειδικότητα</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={255}
                id="profile-specialty"
                value={formData.specialty}
                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                onBlur={() => handleBlur('specialty')}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${touched.specialty && fieldErrors.specialty ? 'border-red-300 bg-red-50/30' : 'border-ink-200'}`}
              />
              {touched.specialty && fieldErrors.specialty && <p className="text-xs text-red-600 mt-1">{fieldErrors.specialty}</p>}
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <ClinicInput
                type="email"
                id="profile-email"
                value={formData.email}
                disabled
                className="w-full cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-xs font-medium text-ink-700 mb-1.5">Τηλέφωνο</label>
              <input
                type="tel"
                required
                minLength={5}
                maxLength={50}
                id="profile-phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                onBlur={() => handleBlur('phone')}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${touched.phone && fieldErrors.phone ? 'border-red-300 bg-red-50/30' : 'border-ink-200'}`}
              />
              {touched.phone && fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label htmlFor="profile-address" className="block text-xs font-medium text-ink-700 mb-1.5">Διεύθυνση</label>
              <input
                type="text"
                required
                minLength={5}
                maxLength={500}
                id="profile-address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                onBlur={() => handleBlur('address')}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${touched.address && fieldErrors.address ? 'border-red-300 bg-red-50/30' : 'border-ink-200'}`}
              />
              {touched.address && fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
            </div>
            <div>
              <label htmlFor="profile-city" className="block text-xs font-medium text-ink-700 mb-1.5">Πόλη</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                id="profile-city"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                onBlur={() => handleBlur('city')}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${touched.city && fieldErrors.city ? 'border-red-300 bg-red-50/30' : 'border-ink-200'}`}
              />
              {touched.city && fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="profile-description" className="block text-xs font-medium text-ink-700 mb-1.5">Περιγραφή</label>
              <textarea
                id="profile-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                onBlur={() => handleBlur('description')}
                rows={3}
                maxLength={2000}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-500 ${touched.description && fieldErrors.description ? 'border-red-300 bg-red-50/30' : 'border-ink-200'}`}
              />
              <div className="flex justify-between mt-1">
                {touched.description && fieldErrors.description ? <p className="text-xs text-red-600">{fieldErrors.description}</p> : <span />}
                <span className="text-xs text-ink-400">{formData.description.length}/2000</span>
              </div>
            </div>
            <div>
              <label htmlFor="profile-licenseNumber" className="block text-xs font-medium text-ink-700 mb-1.5">Αριθμός Άδειας</label>
              <ClinicInput
                type="text"
                id="profile-licenseNumber"
                value={formData.licenseNumber}
                disabled
                className="w-full cursor-not-allowed"
              />
            </div>
          </div>
        </ProfileSection>

        {/* Location */}
        <ProfileSection id="clinic-location" title="Τοποθεσία" description="Τοποθετήστε το ιατρείο σας στον χάρτη ώστε οι κηδεμόνες να μπορούν να σας βρουν.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-800">{formData.address || 'Διεύθυνση ιατρείου'}</h3><p className="mt-1 text-xs text-ink-500">{formData.city}</p>
              {formData.coordinates_lat && formData.coordinates_lng ? (
                <p className="text-sm text-ink-500 mt-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ορισμένη ({Number(formData.coordinates_lat).toFixed(4)}, {Number(formData.coordinates_lng).toFixed(4)})
                </p>
              ) : (
                <p className="text-sm text-ink-400 mt-1">Δεν έχει οριστεί τοποθεσία.</p>
              )}
            </div>
            <ClinicButton variant="primary"
              type="button"
              onClick={() => setShowLocationDialog(true)}
              className="flex-wrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {formData.coordinates_lat ? 'Αλλαγή Τοποθεσίας' : 'Ορισμός Τοποθεσίας'}
            </ClinicButton>
          </div>
        </ProfileSection>

        {/* Working Hours */}
        <ProfileSection id="working-hours" title="Ωράριο λειτουργίας" description="Ορίστε τις ημέρες και τις βάρδιες που δέχεστε ραντεβού. Μπορείτε να προσθέσετε ξεχωριστό απογευματινό ωράριο.">
          <div className="divide-y divide-ink-200">
            {dayOrder.map(day => {
              const schedule = hours[day];
              const hasAfternoon = !!schedule.afternoon;
              return (
                <div key={day} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="w-24 text-sm font-medium text-ink-700">{dayNames[day]}</span>
                    <label className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!schedule.closed}
                        onChange={() =>
                          setHours({ ...hours, [day]: { ...schedule, closed: !schedule.closed } })
                        }
                        className="w-4 h-4 accent-clinic-600 text-clinic-600 border-ink-300 rounded focus:ring-clinic-500"
                      />
                      <span className="text-sm text-ink-600">Ανοιχτά</span>
                    </label>
                    {schedule.closed && <span className="text-sm text-ink-400 italic">Κλειστά</span>}
                  </div>
                  {!schedule.closed && (
                    <div className="space-y-2 md:ml-28">
                      {/* Morning shift */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-ink-500 w-full sm:w-20">Πρωί</span>
                        <ClinicSelect
                          value={schedule.morning?.open || ''}
                          onChange={e => setHours({ ...hours, [day]: { ...schedule, morning: { open: e.target.value, close: schedule.morning?.close || '' } } })}
                          className="px-2 py-1.5"
                        >
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </ClinicSelect>
                        <span className="text-ink-400">-</span>
                        <ClinicSelect
                          value={schedule.morning?.close || ''}
                          onChange={e => setHours({ ...hours, [day]: { ...schedule, morning: { open: schedule.morning?.open || '', close: e.target.value } } })}
                          className="px-2 py-1.5"
                        >
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </ClinicSelect>
                      </div>
                      {/* Afternoon shift */}
                      {hasAfternoon ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-ink-500 w-full sm:w-20">Απόγευμα</span>
                          <ClinicSelect
                            value={schedule.afternoon?.open || ''}
                            onChange={e => setHours({ ...hours, [day]: { ...schedule, afternoon: { open: e.target.value, close: schedule.afternoon?.close || '' } } })}
                            className="px-2 py-1.5"
                          >
                            <option value="">--:--</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </ClinicSelect>
                          <span className="text-ink-400">-</span>
                          <ClinicSelect
                            value={schedule.afternoon?.close || ''}
                            onChange={e => setHours({ ...hours, [day]: { ...schedule, afternoon: { open: schedule.afternoon?.open || '', close: e.target.value } } })}
                            className="px-2 py-1.5"
                          >
                            <option value="">--:--</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </ClinicSelect>
                          <ClinicButton variant="danger"
                            type="button"
                            onClick={() => setHours({ ...hours, [day]: { ...schedule, afternoon: null } })}
                            className="ml-1"
                            title="Αφαίρεση απογευματινού"
                            aria-label="Αφαίρεση απογευματινού"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </ClinicButton>
                        </div>
                      ) : (
                        <ClinicButton variant="ghost"
                          type="button"
                          onClick={() => setHours({ ...hours, [day]: { ...schedule, afternoon: { open: '17:00', close: '21:00' } } })}
                          className=""
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Προσθήκη απογευματινού ωραρίου
                        </ClinicButton>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ProfileSection>

        <SecuritySection />

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
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-ink-500">Αποθηκεύστε τις αλλαγές στα στοιχεία και το ωράριο.</p>
          <ClinicButton variant="primary"
            onClick={handleSave}
            disabled={saving || hasErrors}
            className="disabled:opacity-50"
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
          </ClinicButton>
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

