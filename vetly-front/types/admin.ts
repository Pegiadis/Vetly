export type AdminVetStatus = 'pending' | 'approved' | 'closed';
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

export interface AdminOverview {
  vets: { pending: number; approved: number; closed: number };
  owners: { total: number; unverified: number; suspended: number };
  appointments: { last_7_days: number; last_30_days: number; upcoming: number };
  weeks: { week_start: string; vets: number; owners: number; appointments: number }[];
}
