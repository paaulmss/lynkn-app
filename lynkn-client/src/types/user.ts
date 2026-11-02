export interface ApprovedUser {
  id: number;
  username: string;
  foto_perfil: string;
  lat: number | null;
  lng: number | null;
  bio?: string;
}
export type ViewMode = 'map' | 'posts';
