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
  group_id: string | null;
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

export async function getCustomDiagnosisTypes(): Promise<string[]> {
  const data = await api.get<{ types: string[] }>('/vet/appointments/diagnosis-types');
  return data.types;
}

export async function updateCustomDiagnosisTypes(types: string[]): Promise<string[]> {
  const data = await api.put<{ types: string[] }>('/vet/appointments/diagnosis-types', { types });
  return data.types;
}

export async function getCustomMedicationNames(): Promise<string[]> {
  const data = await api.get<{ names: string[] }>('/vet/appointments/medication-names');
  return data.names;
}

export async function updateCustomMedicationNames(names: string[]): Promise<string[]> {
  const data = await api.put<{ names: string[] }>('/vet/appointments/medication-names', { names });
  return data.names;
}

export async function rescheduleAppointment(
  appointmentId: string,
  scheduledAt: string,
): Promise<VetAppointment> {
  return api.post<VetAppointment>(`/vet/appointments/${appointmentId}/reschedule`, { scheduled_at: scheduledAt });
}

export interface VetAppointmentFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'asc' | 'desc';
}

export function useAllAppointments(page = 1, pageSize = 10, filters: VetAppointmentFilters = {}) {
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filters.status) params.set('status', filters.status);
      if (filters.dateFrom) params.set('date_from', filters.dateFrom);
      if (filters.dateTo) params.set('date_to', filters.dateTo);
      if (filters.sort) params.set('sort', filters.sort);
      const data = await api.get<AppointmentListResponse>(`/vet/appointments?${params.toString()}`);
      setAppointments(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters.status, filters.dateFrom, filters.dateTo, filters.sort]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const totalPages = Math.ceil(total / pageSize);

  return { appointments, total, totalPages, loading, error, refetch: fetchAppointments };
}

// --- Dashboard Stats ---

export interface DashboardStats {
  total_patients: number;
  total_clients: number;
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

export function useVetReviews(page = 1, pageSize = 10) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const data = await api.get<ReviewListResponse>(`/vet/reviews?${params.toString()}`);
      setReviews(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const totalPages = Math.ceil(total / pageSize);

  return { reviews, total, totalPages, loading, error, refetch: fetchReviews };
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

export async function updateReviewReply(reviewId: string, reply: string): Promise<Review> {
  return api.put<Review>(`/vet/reviews/${reviewId}/reply`, { reply });
}

export async function deleteReviewReply(reviewId: string): Promise<Review> {
  return api.delete<Review>(`/vet/reviews/${reviewId}/reply`);
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

export interface Shift {
  open: string;
  close: string;
}

export interface DayHours {
  closed: boolean;
  morning?: Shift | null;
  afternoon?: Shift | null;
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

// --- Shared On-Call Hook ---

const ON_CALL_EVENT = 'vetly:oncall-changed';

export function useOnCall() {
  const { profile } = useVetProfile();
  const [isOnCall, setIsOnCall] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (profile) setIsOnCall(profile.is_on_call);
  }, [profile]);

  useEffect(() => {
    const handler = (e: Event) => {
      setIsOnCall((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener(ON_CALL_EVENT, handler);
    return () => window.removeEventListener(ON_CALL_EVENT, handler);
  }, []);

  const handleToggle = async () => {
    if (toggling) return;
    const newValue = !isOnCall;
    setIsOnCall(newValue);
    setToggling(true);
    window.dispatchEvent(new CustomEvent(ON_CALL_EVENT, { detail: newValue }));
    try {
      await toggleOnCall(newValue);
    } catch {
      setIsOnCall(!newValue);
      window.dispatchEvent(new CustomEvent(ON_CALL_EVENT, { detail: !newValue }));
    } finally {
      setToggling(false);
    }
  };

  return { isOnCall, toggling, handleToggle };
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

interface VetNotificationListResponse {
  items: VetNotification[];
  total: number;
  page: number;
  page_size: number;
}

export function useVetNotifications(page = 1, pageSize = 10) {
  const [notifications, setNotifications] = useState<VetNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const data = await api.get<VetNotificationListResponse>(`/vet/notifications?${params.toString()}`);
      setNotifications(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const totalPages = Math.ceil(total / pageSize);

  return { notifications, total, totalPages, loading, error, refetch: fetchNotifications };
}

export async function markVetNotificationRead(notificationId: string): Promise<VetNotification> {
  return api.patch<VetNotification>(`/vet/notifications/${notificationId}/read`, {});
}

export async function markAllVetNotificationsRead(): Promise<void> {
  return api.post<void>('/vet/notifications/mark-all-read', {});
}

export async function getVetUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/vet/notifications/unread-count');
}

export async function getVetLatestUnread(): Promise<VetNotification | null> {
  return api.get<VetNotification | null>('/vet/notifications/latest-unread');
}

// --- Vet Clients ---

export interface VetClientPet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  gender: string | null;
  notes: string | null;
  created_at: string;
}

export interface LinkedPet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  gender: string | null;
  chip_number: string | null;
  image_url: string | null;
  cover_image_url: string | null;
}

export interface VetClient {
  id: string;
  vet_id: string;
  pet_owner_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  pets: VetClientPet[];
  linked_pets: LinkedPet[];
}

export interface VetClientListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  pet_count: number;
  created_at: string;
}

interface VetClientListResponse {
  items: VetClientListItem[];
  total: number;
  page: number;
  page_size: number;
}

export function useVetClients(page = 1, pageSize = 10, search?: string) {
  const [clients, setClients] = useState<VetClientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (search) params.set('search', search);
      const data = await api.get<VetClientListResponse>(`/vet/clients?${params.toString()}`);
      setClients(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const totalPages = Math.ceil(total / pageSize);

  return { clients, total, totalPages, loading, error, refetch: fetchClients };
}

export function useVetClient(clientId: string | null) {
  const [client, setClient] = useState<VetClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setClient(null);
      return;
    }
    try {
      setLoading(true);
      const data = await api.get<VetClient>(`/vet/clients/${clientId}`);
      setClient(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  return { client, loading, error, refetch: fetchClient };
}

export async function createVetClient(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}): Promise<VetClient> {
  return api.post<VetClient>('/vet/clients', data);
}


export async function updateVetClient(clientId: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}): Promise<VetClient> {
  return api.put<VetClient>(`/vet/clients/${clientId}`, data);
}

export async function deleteVetClient(clientId: string): Promise<void> {
  return api.delete<void>(`/vet/clients/${clientId}`);
}

export async function generateClientInvite(clientId: string): Promise<{ invite_url: string; expires_at: string }> {
  return api.post<{ invite_url: string; expires_at: string }>(`/vet/clients/${clientId}/invite`, {});
}

export async function resendClientInvite(clientId: string): Promise<{ invite_url: string; expires_at: string }> {
  return api.put<{ invite_url: string; expires_at: string }>(`/vet/clients/${clientId}/resend-invite`, {});
}

export async function addClientPet(clientId: string, data: {
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  gender?: string;
  notes?: string;
}): Promise<VetClientPet> {
  return api.post<VetClientPet>(`/vet/clients/${clientId}/pets`, data);
}

export async function updateClientPet(clientId: string, petId: string, data: {
  name?: string;
  type?: string;
  breed?: string;
  age?: number;
  weight?: number;
  gender?: string;
  notes?: string;
}): Promise<VetClientPet> {
  return api.put<VetClientPet>(`/vet/clients/${clientId}/pets/${petId}`, data);
}

export async function deleteClientPet(clientId: string, petId: string): Promise<void> {
  return api.delete<void>(`/vet/clients/${clientId}/pets/${petId}`);
}

// --- Service Types ---

export interface ServiceType {
  id: string;
  vet_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceTypeListResponse {
  items: ServiceType[];
  total: number;
  page: number;
  page_size: number;
}

export function useServiceTypes(page = 1, pageSize = 20) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const data = await api.get<ServiceTypeListResponse>(`/vet/services?${params.toString()}`);
      setServices(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const totalPages = Math.ceil(total / pageSize);

  return { services, total, totalPages, loading, error, refetch: fetchServices };
}

export async function createServiceType(data: {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
}): Promise<ServiceType> {
  return api.post<ServiceType>('/vet/services', data);
}

export async function updateServiceType(id: string, data: Partial<ServiceType>): Promise<ServiceType> {
  return api.put<ServiceType>(`/vet/services/${id}`, data);
}

export async function deleteServiceType(id: string): Promise<void> {
  return api.delete<void>(`/vet/services/${id}`);
}

// --- Document Downloads ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getStoredTokenForDownload(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
}

async function downloadBlob(url: string, filename: string): Promise<void> {
  const token = getStoredTokenForDownload();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('Αποτυχία λήψης αρχείου');
  }
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(objectUrl);
}

export async function downloadPrescription(appointmentId: string): Promise<void> {
  await downloadBlob(
    `${API_BASE_URL}/vet/documents/prescription/${appointmentId}`,
    `prescription_${appointmentId}.pdf`
  );
}

export async function downloadMedicalRecord(petId: string): Promise<void> {
  await downloadBlob(
    `${API_BASE_URL}/vet/documents/medical-record/${petId}`,
    `medical_record_${petId}.pdf`
  );
}

export async function downloadVaccinationCertificate(petId: string): Promise<void> {
  await downloadBlob(
    `${API_BASE_URL}/vet/documents/vaccination-certificate/${petId}`,
    `vaccination_certificate_${petId}.pdf`
  );
}

// --- Vet Reminders ---

export interface VetReminder {
  id: string;
  pet_id: string;
  pet_name: string | null;
  vet_id: string;
  vet_name: string | null;
  pet_owner_id: string;
  type: string;
  title: string;
  message: string | null;
  due_date: string;
  reminder_date: string;
  is_sent: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface VetReminderListResponse {
  items: VetReminder[];
  total: number;
  page: number;
  page_size: number;
}

export function useVetReminders(page = 1, pageSize = 10) {
  const [reminders, setReminders] = useState<VetReminder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<VetReminderListResponse>(`/vet/reminders?page=${page}&page_size=${pageSize}`);
      setReminders(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const totalPages = Math.ceil(total / pageSize);

  return { reminders, total, totalPages, loading, error, refetch: fetchReminders };
}

export async function createReminder(data: {
  pet_id: string;
  type: string;
  title?: string;
  message?: string;
  due_date: string;
  reminder_days_before?: number;
}): Promise<VetReminder> {
  // Strip undefined title so backend auto-generates
  const payload = { ...data };
  if (!payload.title) delete payload.title;
  return api.post<VetReminder>('/vet/reminders', payload);
}

export async function deleteVetReminder(reminderId: string): Promise<void> {
  return api.delete<void>(`/vet/reminders/${reminderId}`);
}

export async function getCustomReminderTypes(): Promise<string[]> {
  const data = await api.get<{ types: string[] }>('/vet/reminders/types');
  return data.types;
}

export async function updateCustomReminderTypes(types: string[]): Promise<string[]> {
  const data = await api.put<{ types: string[] }>('/vet/reminders/types', { types });
  return data.types;
}
