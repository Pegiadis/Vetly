/**
 * Vet types matching backend API responses
 */

export interface Vet {
  id: string;
  name: string;
  email: string;
  specialty: string;
  license_number: string;
  phone: string;
  address: string;
  city: string;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  hours: Record<string, DayHours> | null;
  description: string | null;
  image_url: string | null;
  is_on_call: boolean;
  is_verified: boolean;
  rating_average: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface DayHours {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface VetListResponse {
  items: Vet[];
  total: number;
  page: number;
  page_size: number;
}

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

export interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  avg_per_appointment: number;
  total_appointments_with_price: number;
}

export interface RevenueByServiceItem {
  service_name: string;
  total_revenue: number;
  appointment_count: number;
}

export interface RevenueByServiceResponse {
  items: RevenueByServiceItem[];
  total_revenue: number;
}

// Public vet types (no auth required)
export interface PublicVet {
  id: string;
  name: string;
  slug: string;
  specialty: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  rating_average: number;
  reviews_count: number;
  is_on_call: boolean;
  working_hours: Record<string, DayHours> | null;
}

export interface PublicVetDetail extends PublicVet {
  license_number: string | null;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  description: string | null;
}

export interface PublicVetListResponse {
  items: PublicVet[];
  total: number;
  page: number;
  page_size: number;
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  owner_name: string;
}

export interface PublicReviewListResponse {
  items: PublicReview[];
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
