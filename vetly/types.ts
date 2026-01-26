


export interface Vet {
    id: string;
    name: string;
    specialty: string; // e.g., 'Γενικός Κτηνίατρος', 'Χειρούργος'
    address: string;
    city: string;
    rating: number;
    reviewsCount: number;
    image: string;
    isOnCall: boolean; // Emergency status
    coordinates: { x: number; y: number }; // Mock coordinates for map
    phone: string;
    email?: string;
    website?: string;
    licenseNumber?: string;
    hours: string;
    description: string;
}

export interface Pet {
    id: string;
    name: string;
    type: 'Dog' | 'Cat' | 'Other';
    breed: string;
    age: number;
    image: string;
    weight: number;
    chipNumber?: string;
    history: MedicalEvent[];
    weightHistory?: { date: string; weight: number }[]; // New field for charts
}

export interface MedicalEvent {
    date: string;
    title: string;
    notes: string;
    vetName?: string;
}

export interface Appointment {
    id: string;
    vetId: string;
    petId: string;
    date: string;
    time: string;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'blocked';
    vetName?: string; // Added for UI convenience
    petName?: string; // Added for UI convenience
    ownerName?: string; // Added for Vet UI
    type?: string; // e.g. 'Εμβολιασμός', 'Εξέταση'
}

export interface PetMedication {
    id: string;
    petId: string;
    petName: string;
    name: string; // e.g. "Antibiotics"
    dosage: string; // e.g. "1 pill"
    frequency: 'daily' | 'weekly' | 'once';
    time: string;
    startDate: string;
    endDate?: string;
    notes?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    image?: string;
    pets: Pet[];
    appointments: Appointment[];
    medications: PetMedication[];
}

export interface VetPatient {
    id: string;
    name: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail?: string;
    type: 'Dog' | 'Cat' | 'Other';
    breed: string;
    age: number;
    weight: number;
    gender: 'Male' | 'Female';
    chipNumber?: string;
    image: string;
    lastVisit: string;
    status: 'Active' | 'Inactive' | 'Treatment';
    history: { date: string; title: string; notes: string }[];
}

export interface Notification {
    id: string;
    type: 'Νέο Ραντεβού' | 'Αλλαγή' | 'Ακύρωση' | 'Επείγον' | 'Info';
    text: string;
    time: string;
    read?: boolean;
}

export interface Review {
    id: string;
    vetId: string;
    userId: string;
    userName: string;
    userImage?: string;
    rating: number;
    date: string;
    comment: string;
    reply?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    date: string;
    image: string;
    category: string;
    readTime: string;
}

export type ViewState = 'HOME' | 'FIND_VET' | 'VET_PROFILE' | 'DASHBOARD' | 'LOGIN' | 'USER_PROFILE' | 'ADD_PET' | 'EDIT_PET' | 'CHANGE_APPOINTMENT' | 'USER_CALENDAR' | 'VET_DASHBOARD' | 'VET_PATIENTS' | 'VET_ADD_PATIENT' | 'VET_NEW_APPOINTMENT' | 'VET_SCHEDULE' | 'VET_PROFILE_SETTINGS' | 'VET_APPOINTMENTS_TODAY' | 'VET_PENDING' | 'VET_REVIEWS' | 'VET_REGISTRATION' | 'VET_ANALYTICS' | 'VET_GUIDE' | 'BLOG' | 'BLOG_POST' | 'ABOUT' | 'HOW_IT_WORKS';
