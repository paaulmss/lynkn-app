
export interface User {
  id: number;
  username: string;
  email: string;
  birth_day: string;
  foto_perfil: string;
  selfie_real_time: string;
  is_verified: boolean;
  status_verif: 'unverified' | 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  verif_message?: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category: string;
  max_participants: number;
  current_participants: number;
  lat: number;
  lng: number;
  created_at: string;
  expires_at: string;
  user_id: string;
}