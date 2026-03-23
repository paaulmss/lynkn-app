// Definición del Usuario
export interface User {
  id: string;
  username: string;
  email: string;
  birth_day: string;
  foto_perfil: string;
  selfie_real_time: string;
  is_verified: boolean;
  status_verif: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
}

// Definición de la Actividad para el mapa
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