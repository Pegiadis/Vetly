import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Pet {
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
  deleted_at: string | null;
  created_at: string;
}

export interface Vet {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  address: string | null;
  rating_average: number;
  reviews_count: number;
  image_url: string | null;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
}

export interface AppointmentPetInfo {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  image_url: string | null;
}

export interface AppointmentVetInfo {
  id: string;
  name: string;
  specialty: string;
  address: string | null;
  city: string | null;
  image_url: string | null;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
}

export interface Appointment {
  id: string;
  vet_id: string;
  pet_id: string;
  pet_owner_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  pet: AppointmentPetInfo | null;
  vet: AppointmentVetInfo | null;
}

interface VetListResponse {
  items: Vet[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function useMyPets(page = 1, pageSize = 6) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<PaginatedResponse<Pet>>(`/owner/pets?page=${page}&page_size=${pageSize}`);
      setPets(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return { pets, total, totalPages: Math.ceil(total / pageSize), loading, error, refetch: fetchPets };
}

export function useVets() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchVets = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not on refetch
      if (!hasFetchedRef.current) setLoading(true);
      const data = await api.get<VetListResponse>(`/vets?_t=${Date.now()}`);
      setVets(data.items);
      setError(null);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  return { vets, loading, error, refetch: fetchVets };
}

export interface OnCallVet {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  address: string;
  city: string;
  image_url: string | null;
  coordinates_lat: number;
  coordinates_lng: number;
  rating_average: number;
  reviews_count: number;
  is_on_call: boolean;
  is_verified: boolean;
  hours: Record<string, { open: string | null; close: string | null; closed: boolean }> | null;
}

export function useOnCallVets() {
  const [vets, setVets] = useState<OnCallVet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnCallVets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ items: OnCallVet[]; count: number }>('/vets/on-call');
      setVets(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch on-call vets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnCallVets();
    const interval = setInterval(fetchOnCallVets, 30000);
    return () => clearInterval(interval);
  }, [fetchOnCallVets]);

  return { vets, loading, error, refetch: fetchOnCallVets };
}

export function useAvailableSlots(vetId: string | null, date: string | null) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vetIdRef = useRef(vetId);
  const dateRef = useRef(date);
  vetIdRef.current = vetId;
  dateRef.current = date;

  const fetchSlots = useCallback(async () => {
    const v = vetIdRef.current;
    const d = dateRef.current;
    if (!v || !d) {
      setSlots([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ date: string; vet_id: string; slots: string[] }>(
        `/vets/${v}/available-slots?date=${d}`
      );
      setSlots(data.slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available slots');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!vetId || !date) {
      setSlots([]);
      return;
    }
    fetchSlots();
  }, [vetId, date, fetchSlots]);

  return { slots, loading, error, refetch: fetchSlots };
}

export interface AppointmentFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  petName?: string;
}

export function useMyAppointments(page = 1, pageSize = 10, filters: AppointmentFilters = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      if (filters.petName) params.set('pet_name', filters.petName);
      const data = await api.get<PaginatedResponse<Appointment>>(`/owner/appointments?${params.toString()}`);
      setAppointments(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters.status, filters.dateFrom, filters.dateTo, filters.petName]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, total, totalPages: Math.ceil(total / pageSize), loading, error, refetch: fetchAppointments };
}

export function useUpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.get<Appointment[]>('/owner/appointments/upcoming');
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return { appointments, loading, error, refetch: fetchAppointments };
}

export interface CreateAppointmentRequest {
  vet_id: string;
  pet_id: string;
  scheduled_at: string;
  type: string;
  duration_minutes?: number;
  notes?: string;
}

export async function createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
  return api.post<Appointment>('/owner/appointments', data);
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return api.post<Appointment>(`/owner/appointments/${appointmentId}/cancel`, {});
}

export async function rescheduleAppointment(appointmentId: string, scheduled_at: string): Promise<Appointment> {
  return api.patch<Appointment>(`/owner/appointments/${appointmentId}/reschedule`, { scheduled_at });
}

// --- Medical History ---

export interface MedicalEventVetInfo {
  id: string;
  name: string;
  specialty: string;
}

export interface OwnerMedicalEvent {
  id: string;
  pet_id: string;
  vet_id: string | null;
  date: string;
  title: string;
  notes: string | null;
  event_type: string;
  created_at: string;
  vet: MedicalEventVetInfo | null;
}

export function usePetMedicalHistory(petId: string | null, page = 1, pageSize = 10, eventType?: string) {
  const [events, setEvents] = useState<OwnerMedicalEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (eventType) params.set('event_type', eventType);
      const data = await api.get<PaginatedResponse<OwnerMedicalEvent>>(`/owner/pets/${petId}/medical-history?${params.toString()}`);
      setEvents(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medical history');
    } finally {
      setLoading(false);
    }
  }, [petId, page, pageSize, eventType]);

  useEffect(() => {
    if (petId) fetchHistory();
    else { setEvents([]); setTotal(0); }
  }, [petId, fetchHistory]);

  return { events, total, totalPages: Math.ceil(total / pageSize), loading, error, refetch: fetchHistory };
}

// --- Medications ---

export interface MedicationPetInfo {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
}

export interface OwnerMedication {
  id: string;
  pet_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  pet: MedicationPetInfo | null;
}

export function useMyMedications(isActive?: boolean, page = 1, pageSize = 10) {
  const [medications, setMedications] = useState<OwnerMedication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (isActive !== undefined) params.set('is_active', String(isActive));
      const data = await api.get<PaginatedResponse<OwnerMedication>>(`/owner/medications?${params.toString()}`);
      setMedications(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  }, [isActive, page, pageSize]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return { medications, total, totalPages: Math.ceil(total / pageSize), loading, error, refetch: fetchMedications };
}

export async function deleteMedication(medicationId: string): Promise<void> {
  return api.delete<void>(`/owner/medications/${medicationId}`);
}

// --- Reviews ---

export interface ReviewVetInfo {
  id: string;
  name: string;
  specialty: string;
  image_url: string | null;
}

export interface OwnerReview {
  id: string;
  vet_id: string;
  pet_owner_id: string;
  appointment_id: string | null;
  rating: number;
  comment: string;
  reply: string | null;
  created_at: string;
  updated_at: string;
  vet: ReviewVetInfo | null;
}

export function useMyReviews(page = 1, pageSize = 10) {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<PaginatedResponse<OwnerReview>>(`/owner/reviews?page=${page}&page_size=${pageSize}`);
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

  return { reviews, total, totalPages: Math.ceil(total / pageSize), loading, error, refetch: fetchReviews };
}

export async function createReview(data: {
  vet_id: string;
  appointment_id?: string;
  rating: number;
  comment: string;
}): Promise<OwnerReview> {
  return api.post<OwnerReview>('/owner/reviews', data);
}

export async function updateReview(
  reviewId: string,
  data: { rating?: number; comment?: string }
): Promise<OwnerReview> {
  return api.put<OwnerReview>(`/owner/reviews/${reviewId}`, data);
}

export async function deleteReview(reviewId: string): Promise<void> {
  return api.delete<void>(`/owner/reviews/${reviewId}`);
}

// --- Notifications ---

export interface OwnerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useMyNotifications(page = 1, pageSize = 10) {
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<PaginatedResponse<OwnerNotification>>(`/owner/notifications?page=${page}&page_size=${pageSize}`);
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

  return { notifications, total, totalPages: Math.ceil(total / pageSize), loading, error, refetch: fetchNotifications };
}

export async function markNotificationRead(notificationId: string): Promise<OwnerNotification> {
  return api.patch<OwnerNotification>(`/owner/notifications/${notificationId}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  return api.post<void>('/owner/notifications/mark-all-read', {});
}

// --- Owner Profile ---

export interface OwnerProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function useOwnerProfile() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<OwnerProfile>('/auth/pet-owner/me');
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

export async function updateOwnerProfile(data: {
  name?: string;
  phone?: string;
  address?: string;
}): Promise<OwnerProfile> {
  return api.put<OwnerProfile>('/owner/profile', data);
}

export async function uploadOwnerPhoto(file: File): Promise<{ url: string }> {
  return api.upload<{ url: string }>('/uploads/owner/photo', file);
}

export async function uploadPetPhoto(petId: string, file: File): Promise<{ url: string }> {
  return api.upload<{ url: string }>(`/uploads/pet/${petId}/photo`, file);
}

export async function uploadPetCover(petId: string, file: File): Promise<{ url: string }> {
  return api.upload<{ url: string }>(`/uploads/pet/${petId}/cover`, file);
}

// --- Pet CRUD ---

export async function createPet(data: {
  name: string;
  type: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  chip_number?: string;
}): Promise<Pet> {
  return api.post<Pet>('/owner/pets', data);
}

export async function updatePet(
  petId: string,
  data: {
    name?: string;
    breed?: string;
    age?: number;
    weight?: number;
    chip_number?: string;
  }
): Promise<Pet> {
  return api.put<Pet>(`/owner/pets/${petId}`, data);
}

export async function deletePet(petId: string): Promise<void> {
  return api.delete<void>(`/owner/pets/${petId}`);
}

export function useDeletedPets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<Pet[]>('/owner/pets/deleted');
      setPets(data);
    } catch {
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { pets, loading, refetch: fetch };
}

export async function restorePet(petId: string): Promise<Pet> {
  return api.post<Pet>(`/owner/pets/${petId}/restore`, {});
}
