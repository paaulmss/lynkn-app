export interface ApprovedUser {
  id: number;
  username: string;
  fotoPerfil: string;
  lat: number;
  lng: number;
  bio?: string;
}

export type ViewMode = 'map' | 'posts';