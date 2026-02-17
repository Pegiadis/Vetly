import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

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

export function useMyPets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Pet[]>('/owner/pets');
      setPets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return { pets, loading, error, refetch: fetchPets };
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

export function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.get<Appointment[]>('/owner/appointments');
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
  return api.post<Appointment>(`/owner/appointments/${appointmentId}/cancel`);
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

interface MedicalHistoryResponse {
  items: OwnerMedicalEvent[];
  total: number;
}

export function usePetMedicalHistory(petId: string | null) {
  const [events, setEvents] = useState<OwnerMedicalEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const data = await api.get<MedicalHistoryResponse>(`/owner/pets/${petId}/medical-history`);
      setEvents(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medical history');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) fetchHistory();
    else { setEvents([]); setTotal(0); }
  }, [petId, fetchHistory]);

  return { events, total, loading, error, refetch: fetchHistory };
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

export function useMyMedications(isActive?: boolean) {
  const [medications, setMedications] = useState<OwnerMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (isActive !== undefined) params.set('is_active', String(isActive));
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<OwnerMedication[]>(`/owner/medications${query}`);
      setMedications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  }, [isActive]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return { medications, loading, error, refetch: fetchMedications };
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

export function useMyReviews() {
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<OwnerReview[]>('/owner/reviews');
      setReviews(data);
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

  return { reviews, loading, error, refetch: fetchReviews };
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

export function useMyNotifications() {
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<OwnerNotification[]>('/owner/notifications');
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
