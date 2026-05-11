import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Post } from './Profile';

interface ProfileMapProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
}

const ProfileMap = ({ posts, onMarkerClick }: ProfileMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const isDarkMode = localStorage.getItem("theme") !== "light";

  // 1. Inicialización del Mapa
  useEffect(() => {
    if (!mapContainer.current) return;
    
    const API_KEY = import.meta.env.VITE_STADIA_API_KEY;
    
    const styleName = isDarkMode ? "alidade_smooth_dark" : "alidade_smooth";
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://tiles.stadiamaps.com/styles/${styleName}.json?api_key=${API_KEY}`,
      center: [-3.7037, 40.4167],
      zoom: 11,
      attributionControl: false
    });

    const timer = setTimeout(() => {
      map.current?.resize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!posts || posts.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasValidCoords = false;

    posts.forEach((post) => {
      if (!post.lat || !post.lng) return;
      hasValidCoords = true;

      const el = document.createElement('div');
      el.className = 'profile-marker-pin';
      
      const imgDiv = document.createElement('div');
      imgDiv.className = 'marker-image';
      imgDiv.style.backgroundImage = `url(${post.image_url || ''})`;
      
      el.appendChild(imgDiv);
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick(post);
        map.current?.flyTo({ 
          center: [Number(post.lng), Number(post.lat)], 
          zoom: 15,
          essential: true 
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(post.lng), Number(post.lat)])
        .addTo(map.current!);
      
      markersRef.current.push(marker);
      bounds.extend([Number(post.lng), Number(post.lat)]);
    });

    if (hasValidCoords) {
      if (posts.length === 1) {
        map.current.setCenter([Number(posts[0].lng), Number(posts[0].lat)]);
        map.current.setZoom(14);
      } else {
        map.current.fitBounds(bounds, { 
          padding: 70, 
          maxZoom: 15, 
          duration: 1200 
        });
      }
    }
  }, [posts, onMarkerClick]);

  return (
    <div 
      ref={mapContainer} 
      className="profile-map-container" 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '400px', 
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'var(--bg-input)'
      }} 
    />
  );
};

export default ProfileMap;