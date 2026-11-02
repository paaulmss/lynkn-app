/** Database row contract. Supabase returns column names without ORM mapping. */
export interface User extends Record<string, unknown> {
  id: number;
  username: string;
  email: string;
  pwd: string | null;
  foto_perfil: string | null;
  bio: string | null;
  location: string | null;
  birth_day: string | null;
  role: 'admin' | 'user';
  selfie_real_time: string | null;
  status_verif: 'unverified' | 'pending' | 'approved' | 'rejected';
  verif_message: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  google_id: string | null;
  supabase_auth_id: string | null;
  phone: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  theme: 'light' | 'dark' | null;
  language: 'es' | 'en' | null;
}
