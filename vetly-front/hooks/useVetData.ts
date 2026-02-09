import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AppointmentPet {
  id: string;
  name: string;
  type: string;
  breed: string;
  image_url: string | null;
}

export interface AppointmentPetOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface VetAppointment {
  id: string;
  vet_id: string;
  pet_owner_id: string;
  pet_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  pet: AppointmentPet | null;
  pet_owner: AppointmentPetOwner | null;
}

interface AppointmentListResponse {
  items: VetAppointment[];
  total: number;
  page: number;
  page_size: number;
}

export function useTodayAppointments() {
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<AppointmentListResponse>('/vet/appointments/today');
      setAppointments(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments };
}

export function usePendingAppointments() {
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<AppointmentListResponse>('/vet/appointments/pending');
      setAppointments(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments };
}

export async function approveAppointment(appointmentId: string): Promise<VetAppointment> {
  return api.post<VetAppointment>(`/vet/appointments/${appointmentId}/approve`, {});
}

export async function rejectAppointment(appointmentId: string, reason?: string): Promise<VetAppointment> {
  return api.post<VetAppointment>(`/vet/appointments/${appointmentId}/reject`, { reason });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'confirmed' | 'completed' | 'cancelled',
  notes?: string
): Promise<VetAppointment> {
  return api.patch<VetAppointment>(`/vet/appointments/${appointmentId}/status`, { status, notes });
}
