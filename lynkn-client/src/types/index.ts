export type Role = 'user' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected';
export interface User {
  id: number;
  username: string;
  email?: string;
  birth_day?: string | null;
  foto_perfil: string;
  bio?: string;
  location?: string;
  role: Role;
  status_verif: VerificationStatus;
  verif_message?: string;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
}
export interface Post {
  id: number;
  user_id: number;
  title: string;
  description: string;
  image_url?: string;
  category: string;
  lat: number;
  lng: number;
  max_particip?: number;
  current_particip?: number;
  favorite_count?: number;
  is_favorited?: boolean;
  created_at?: string;
  event_date?: string;
  status?: string;
  likes?: number;
  comments?: number;
  users?: { username: string; foto_perfil: string };
  userStatus?: 'available' | 'pending' | 'accepted' | 'rejected';
}
