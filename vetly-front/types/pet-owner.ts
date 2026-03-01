/**
 * Pet Owner types matching backend API responses
 */

export interface PetOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  pet_owner_id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Other';
  breed: string;
  age: number;
  weight: number;
  gender: 'Male' | 'Female';
  chip_number: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetWithOwner extends Pet {
  owner: PetOwner | null;
}

export interface Appointment {
  id: string;
  vet_id: string;
  pet_owner_id: string;
  pet_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentDetail extends Appointment {
  pet: {
    id: string;
    name: string;
    type: string;
    breed: string;
    image_url: string | null;
  } | null;
  vet: {
    id: string;
    name: string;
    specialty: string;
    image_url: string | null;
  } | null;
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
}

export interface ReviewWithVet extends Review {
  vet: {
    id: string;
    name: string;
    specialty: string;
    image_url: string | null;
  } | null;
}

export interface Medication {
  id: string;
  pet_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

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

export interface Notification {
  id: string;
  pet_owner_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Reminder {
  id: string;
  pet_id: string;
  pet_name: string | null;
  vet_id: string;
  vet_name: string | null;
  pet_owner_id: string;
  type: 'vaccination' | 'checkup' | 'medication' | 'custom';
  title: string;
  message: string | null;
  due_date: string;
  reminder_date: string;
  is_sent: boolean;
  is_dismissed: boolean;
  created_at: string;
}
