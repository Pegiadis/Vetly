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

export interface ExaminationMedication {
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'once';
  time?: string;
  duration_days?: number;
  notes?: string;
}

export interface CompleteExaminationData {
  diagnosis: string;
  examination_notes?: string;
  medications: ExaminationMedication[];
}

export async function completeExamination(
  appointmentId: string,
  data: CompleteExaminationData,
): Promise<VetAppointment> {
  return api.post<VetAppointment>(`/vet/appointments/${appointmentId}/complete`, data);
}

export function useAllAppointments(status?: string) {
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page_size', '50');
      const data = await api.get<AppointmentListResponse>(`/vet/appointments?${params.toString()}`);
      setAppointments(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, total, loading, error, refetch: fetchAppointments };
}

// --- Dashboard Stats ---

export interface DashboardStats {
  total_patients: number;
  total_appointments: number;
  pending_appointments: number;
  today_appointments: number;
  completed_this_month: number;
  average_rating: number;
  total_reviews: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<DashboardStats>('/vet/dashboard/stats');
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// --- Patients ---

export interface PatientOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image_url: string | null;
}

export interface Patient {
  id: string;
  pet_owner_id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  chip_number: string | null;
  image_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  owner?: PatientOwner | null;
}

interface PatientListResponse {
  items: Patient[];
  total: number;
  page: number;
  page_size: number;
}

export function usePatients(search?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page_size', '50');
      const data = await api.get<PatientListResponse>(`/vet/patients?${params.toString()}`);
      setPatients(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, total, loading, error, refetch: fetchPatients };
}

export interface PatientWithOwner extends Patient {
  owner: PatientOwner | null;
}

export function usePatient(petId: string | null) {
  const [patient, setPatient] = useState<PatientWithOwner | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const data = await api.get<PatientWithOwner>(`/vet/patients/${petId}`);
      setPatient(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) fetchPatient();
    else setPatient(null);
  }, [petId, fetchPatient]);

  return { patient, loading, error, refetch: fetchPatient };
}

// --- Patient History ---

export interface MedicalEvent {
  id: string;
  pet_id: string;
  vet_id: string | null;
  date: string;
  title: string;
  notes: string | null;
  event_type: string;
  created_at: string;
}

interface MedicalHistoryResponse {
  items: MedicalEvent[];
  total: number;
}

export function usePatientHistory(petId: string | null) {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const data = await api.get<MedicalHistoryResponse>(`/vet/patients/${petId}/history`);
      setEvents(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) fetchHistory();
    else setEvents([]);
  }, [petId, fetchHistory]);

  return { events, loading, error, refetch: fetchHistory };
}

// --- Reviews ---

export interface ReviewPetOwner {
  id: string;
  name: string;
  image_url: string | null;
}

export interface Review {
  id: string;
  vet_id: string;
  pet_owner_id: string;
  appointment_id: string | null;
  rating: number;
  comment: string;
  reply: string | null;
  created_at: string;
  updated_at: string;
  pet_owner: ReviewPetOwner | null;
}

interface ReviewListResponse {
  items: Review[];
  total: number;
  page: number;
  page_size: number;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: { rating: number; count: number; percentage: number }[];
}

export function useVetReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ReviewListResponse>('/vet/reviews?page_size=50');
      setReviews(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, total, loading, error, refetch: fetchReviews };
}

export function useVetReviewStats() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ReviewStats>('/vet/reviews/stats');
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export async function replyToReview(reviewId: string, reply: string): Promise<Review> {
  return api.post<Review>(`/vet/reviews/${reviewId}/reply`, { reply });
}

// --- Analytics ---

export interface FullAnalytics {
  dashboard: DashboardStats;
  appointment_trends: {
    items: { date: string; count: number }[];
    total: number;
    period_start: string;
    period_end: string;
  };
  service_breakdown: {
    items: { service_type: string; count: number; percentage: number }[];
    total: number;
  };
  peak_hours: {
    items: { hour: number; count: number; percentage: number }[];
    busiest_hour: number;
    total_appointments: number;
  };
  patient_types: {
    items: { pet_type: string; count: number; percentage: number }[];
    total: number;
  };
}

export function useFullAnalytics() {
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<FullAnalytics>('/vet/analytics');
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

// --- Vet Profile ---

export interface DayHours {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface VetProfile {
  id: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
  address: string;
  city: string;
  description: string | null;
  image_url: string | null;
  license_number: string;
  hours: Record<string, DayHours> | null;
  is_on_call: boolean;
  is_verified: boolean;
  rating_average: number;
  reviews_count: number;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  created_at: string;
  updated_at: string;
}

export function useVetProfile() {
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<VetProfile>('/vets/me');
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

export async function updateVetProfile(data: {
  name?: string;
  specialty?: string;
  phone?: string;
  address?: string;
  city?: string;
  description?: string;
  image_url?: string;
  coordinates_lat?: number | null;
  coordinates_lng?: number | null;
}): Promise<VetProfile> {
  return api.put<VetProfile>('/vets/me', data);
}

export async function uploadVetPhoto(file: File): Promise<{ url: string }> {
  return api.upload<{ url: string }>('/uploads/vet/photo', file);
}

export async function updateVetHours(hours: Record<string, DayHours>): Promise<VetProfile> {
  return api.put<VetProfile>('/vets/me/hours', { hours });
}

export async function toggleOnCall(is_on_call: boolean): Promise<VetProfile> {
  return api.patch<VetProfile>('/vets/me/on-call', { is_on_call });
}

// --- Vet Create Appointment ---

export interface VetCreateAppointmentData {
  pet_id: string;
  scheduled_at: string;
  type: string;
  duration_minutes?: number;
  notes?: string;
}

export async function createVetAppointment(data: VetCreateAppointmentData): Promise<VetAppointment> {
  return api.post<VetAppointment>('/vet/appointments', data);
}

export function useVetAvailableSlots(vetId: string | null, date: string | null) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vetId || !date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ date: string; vet_id: string; slots: string[] }>(
          `/vets/${vetId}/available-slots?date=${date}`
        );
        setSlots(data.slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [vetId, date]);

  return { slots, loading, error };
}

// --- Week Appointments (Schedule) ---

export function useWeekAppointments(weekStart: string) {
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const start = new Date(weekStart + 'T00:00:00');
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const dateFrom = weekStart;
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateTo = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
      const data = await api.get<AppointmentListResponse>(
        `/vet/appointments?date_from=${dateFrom}&date_to=${dateTo}&page_size=100`
      );
      setAppointments(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments };
}

// --- Vet Notifications ---

export interface VetNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useVetNotifications() {
  const [notifications, setNotifications] = useState<VetNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<VetNotification[]>('/vet/notifications');
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, error, refetch: fetchNotifications };
}

export async function markVetNotificationRead(notificationId: string): Promise<VetNotification> {
  return api.patch<VetNotification>(`/vet/notifications/${notificationId}/read`, {});
}

export async function markAllVetNotificationsRead(): Promise<void> {
  return api.post<void>('/vet/notifications/mark-all-read', {});
}
