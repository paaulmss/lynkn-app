import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ApprovedUser } from '../types/user.ts';

interface UseMapLibreOptions {
  enabled: boolean;
  apiUrl: string;
}

export const useMapLibre = ({ enabled, apiUrl }: UseMapLibreOptions) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUserMarker = useCallback((user: ApprovedUser, mapInstance: maplibregl.Map) => {
    const el = document.createElement('div');
    el.className = 'w-12 h-12 rounded-full bg-cover bg-center border-2 border-white cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.4)] transition-transform duration-200 hover:scale-110 hover:border-cyan-400 hover:z-10';
    el.style.backgroundImage = `url(${user.fotoPerfil})`;

    const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
      .setHTML(`
        <div class="bg-zinc-900 text-white rounded-xl overflow-hidden border border-zinc-800 shadow-2xl min-w-[180px]">
          <img src="${user.fotoPerfil}" class="w-full h-24 object-cover border-b border-zinc-800" />
          <div class="p-3">
            <strong class="block text-sm font-bold tracking-tight uppercase">${user.username}</strong>
            <p class="text-[11px] text-zinc-400 leading-tight my-1">${user.bio || 'Miembro verificado'}</p>
            <div class="flex items-center gap-1 mt-2">
               <span class="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
               <span class="text-[10px] text-cyan-400 font-medium">CONECTADO</span>
            </div>
          </div>
        </div>
      `);

    new maplibregl.Marker(el)
      .setLngLat([user.lng, user.lat])
      .setPopup(popup)
      .addTo(mapInstance);
  }, []);

  const loadApprovedUsers = useCallback(async (mapInstance: maplibregl.Map) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/users/approved`);
      const users: ApprovedUser[] = res.ok ? await res.json() : [];

      if (users.length > 0) {
        users.forEach(u => u.lat && u.lng && createUserMarker(u, mapInstance));
      } else {
        const mockUsers: ApprovedUser[] = [
          { id: 1, username: 'Adrián', fotoPerfil: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', lat: 40.4225, lng: -3.7035, bio: 'Explorando Madrid 📍' },
          { id: 2, username: 'Sofía', fotoPerfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', lat: 40.4180, lng: -3.7140, bio: 'Diseño y café ☕' }
        ];
        mockUsers.forEach(u => createUserMarker(u, mapInstance));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, createUserMarker]);

  const initializeGeolocation = useCallback((mapInstance: maplibregl.Map) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        mapInstance.flyTo({ center: coords, zoom: 15 });
        
        const el = document.createElement('div');
        el.className = 'w-4 h-4 bg-cyan-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]';
        new maplibregl.Marker(el).setLngLat(coords).addTo(mapInstance);
      });
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !enabled) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      center: [-3.7037, 40.4167],
      zoom: 14,
      attributionControl: false
    });

    map.current.on('load', () => {
      if (map.current) {
        loadApprovedUsers(map.current);
        initializeGeolocation(map.current);
      }
    });

    return () => { map.current?.remove(); };
  }, [enabled, loadApprovedUsers, initializeGeolocation]);

  const recenterMap = () => userLocation && map.current?.flyTo({ center: userLocation, zoom: 15 });

  return { mapContainer, userLocation, isLoading, recenterMap };
};