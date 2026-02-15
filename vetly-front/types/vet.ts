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
