export type AdminVetStatus = 'active' | 'invited' | 'suspended' | 'closed';
export type DemoStatus = 'new' | 'contacted' | 'converted' | 'closed';
export type AdminOwnerStatus = 'active' | 'unverified' | 'suspended';

export interface AdminMe {
  id: string;
  email: string;
  name: string;
}

export interface AdminVet {
  id: string;
  name: string;
  email: string;
  license_number: string;
  specialty: string;
  city: string;
  phone: string;
  email_verified: boolean;
  is_verified: boolean;
  created_at: string;
  slug: string | null;
  deactivated_at: string | null;
  status: AdminVetStatus;
  appointments_count: number;
  clients_count: number;
}

export interface AdminOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  suspended_at: string | null;
  created_at: string;
  status: AdminOwnerStatus;
  pets_count: number;
  appointments_count: number;
}

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface DemoRequest {
  id: string;
  name: string;
  clinic_name: string;
  email: string;
  phone: string;
  city: string;
  message: string | null;
  status: DemoStatus;
  vet_id: string | null;
  created_at: string;
}

export interface AdminVetCreate {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  specialty: string;
  license_number: string;
  demo_request_id?: string;
}

export interface AdminOverview {
  demo_requests: { new: number; total: number };
  vets: { active: number; invited: number; suspended: number; closed: number };
  owners: { total: number; unverified: number; suspended: number };
  appointments: { last_7_days: number; last_30_days: number; upcoming: number };
  weeks: { week_start: string; demo_requests: number; vets: number; owners: number; appointments: number }[];
}
