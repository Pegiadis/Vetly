'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VetSettingsPage() {
  const [formData, setFormData] = useState({
    name: 'Δρ. Γεώργιος Παπαδόπουλος',
    specialty: 'Γενικός Κτηνίατρος',
    email: 'g.papadopoulos@vetly.gr',
    phone: '+30 210 1234567',
    address: 'Λεωφ. Κηφισίας 120',
    city: 'Αθήνα',
    description: 'Εξειδικευμένος στην παθολογία μικρών ζώων με πάνω από 15 χρόνια εμπειρίας.',
    licenseNumber: 'VET-2024-12345',
  });

  const [hours, setHours] = useState({
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '21:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '14:00', closed: false },
    sunday: { open: '', close: '', closed: true },
  });

  const dayNames: Record<string, string> = {
    monday: 'Δευτέρα',
    tuesday: 'Τρίτη',
    wednesday: 'Τετάρτη',
    thursday: 'Πέμπτη',
    friday: 'Παρασκευή',
    saturday: 'Σάββατο',
    sunday: 'Κυριακή',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Ρυθμίσεις Προφίλ</h1>
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Φωτογραφία Προφίλ</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              <img
                src="https://picsum.photos/400/400?random=1"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                Αλλαγή Φωτογραφίας
              </button>
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
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ωράριο Λειτουργίας</h2>
          <div className="space-y-3">
            {Object.entries(hours).map(([day, schedule]) => (
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
                      value={schedule.open}
                      onChange={e =>
                        setHours({ ...hours, [day]: { ...schedule, open: e.target.value } })
                      }
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={schedule.close}
                      onChange={e =>
                        setHours({ ...hours, [day]: { ...schedule, close: e.target.value } })
                      }
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </>
                )}
                {schedule.closed && <span className="text-sm text-slate-400 italic">Κλειστά</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">
            Αποθήκευση Αλλαγών
          </button>
        </div>
      </div>
    </div>
  );
}
