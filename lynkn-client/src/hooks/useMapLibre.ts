import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from '../lib/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import api from '../api/axiosConfig';
import type { ApprovedUser } from '../types/user';

interface Options { enabled: boolean; apiUrl: string; }
export const useMapLibre = ({ enabled, apiUrl }: Options) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  useEffect(() => {
    if (!enabled || !mapContainer.current) return;
    let disposed = false;
    const controller = new AbortController();
    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      center: [-3.7037, 40.4167], zoom: 14,
    });
    map.current = instance;
    const markers: maplibregl.Marker[] = [];
    instance.on('load', () => {
      setIsLoading(true); setError(null);
      api.get<ApprovedUser[]>(apiUrl + '/users/approved', { signal: controller.signal })
        .then(({ data }) => {
          if (disposed) return;
          setIsEmpty(data.length === 0);
          data.forEach((user) => {
            if (user.lat === null || user.lng === null || !Number.isFinite(user.lat) || !Number.isFinite(user.lng)) return;
            const popup = document.createElement('div');
            const name = document.createElement('strong');
            const bio = document.createElement('p');
            name.textContent = user.username; bio.textContent = user.bio || '';
            popup.append(name, bio);
            markers.push(new maplibregl.Marker()
              .setLngLat([user.lng, user.lat])
              .setPopup(new maplibregl.Popup().setDOMContent(popup)).addTo(instance));
          });
        }).catch(() => { if (!disposed) setError('No se pudo cargar el mapa'); })
        .finally(() => { if (!disposed) setIsLoading(false); });
      navigator.geolocation?.getCurrentPosition((position) => {
        if (disposed) return;
        const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
        setUserLocation(coordinates);
        instance.flyTo({ center: coordinates, zoom: 15 });
      });
    });
    return () => {
      disposed = true; controller.abort(); markers.forEach((marker) => marker.remove());
      instance.remove();
      if (map.current === instance) map.current = null;
    };
  }, [enabled, apiUrl]);
  const recenterMap = useCallback(() => {
    if (userLocation) map.current?.flyTo({ center: userLocation, zoom: 15 });
  }, [userLocation]);
  return { mapContainer, userLocation, isLoading, error, isEmpty, recenterMap };
};
