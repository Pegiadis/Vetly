import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  gender: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Vet {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  rating_average: number;
  reviews_count: number;
  image_url: string | null;
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

  useEffect(() => {
    const fetchPets = async () => {
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
    };

    fetchPets();
  }, []);

  return { pets, loading, error, refetch: () => {} };
}

export function useVets() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVets = async () => {
      try {
        setLoading(true);
        // Use the public vets endpoint
        const data = await api.get<VetListResponse>('/vets');
        setVets(data.items);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vets');
      } finally {
        setLoading(false);
      }
    };

    fetchVets();
  }, []);

  return { vets, loading, error };
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
