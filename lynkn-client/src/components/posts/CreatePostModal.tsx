import React, { useState, useRef, useEffect, useCallback } from "react";
import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Camera,
  X,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Search,
  Map as MapIcon,
  Navigation,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosConfig";
import "./CreatePostModal.css";

interface NSFWPrediction {
  className: "Hentai" | "Porn" | "Sexy" | "Drawing" | "Neutral";
  probability: number;
}

interface NSFWModel {
  classify: (
    img: HTMLImageElement | HTMLCanvasElement,
  ) => Promise<NSFWPrediction[]>;
}

interface CreatePostProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePostModal = ({ onClose, onSuccess }: CreatePostProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUnsafe, setIsUnsafe] = useState(false);
  const [model, setModel] = useState<NSFWModel | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: 40.4167,
    lng: -3.7037,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMiniMap, setShowMiniMap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const miniMapContainer = useRef<HTMLDivElement>(null);
  const miniMap = useRef<maplibregl.Map | null>(null);
  const miniMarker = useRef<maplibregl.Marker | null>(null);

  // 1. Análisis de Seguridad (Blindado contra 0x0)
  const analyzeImage = useCallback(async () => {
    if (!model || !imgRef.current || imgRef.current.naturalWidth === 0) return;

    setIsAnalyzing(true);
    setIsUnsafe(false);
    try {
      const predictions = await model.classify(imgRef.current);
      const highProbabilityTrigger = 0.65;
      const detectedUnsafe = predictions.some(
        (p: NSFWPrediction) =>
          ["Porn", "Hentai", "Sexy"].includes(p.className) &&
          p.probability > highProbabilityTrigger,
      );
      if (detectedUnsafe) setIsUnsafe(true);
    } catch (err) {
      console.error("Error análisis:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [model]);

  // 2. Inicialización: IA y GPS
  useEffect(() => {
    const initModal = async () => {
      try {
        await tf.ready();
        const loadedModel = (await nsfwjs.load()) as unknown as NSFWModel;
        setModel(loadedModel);
      } catch (err) {
        console.error("Error IA:", err);
      }

      if ("geolocation" in navigator) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            setIsLocating(false);
          },
          () => setIsLocating(false),
        );
      }
    };
    initModal();
  }, []);

  // 3. Limpieza de memoria y disparo de análisis
  useEffect(() => {
    if (preview && model && imgRef.current) {
      // Esperamos a que la imagen cargue realmente antes de analizar
      const handleLoad = () => analyzeImage();
      const currentImg = imgRef.current;
      currentImg.addEventListener("load", handleLoad);
      return () => {
        currentImg.removeEventListener("load", handleLoad);
      };
    }

    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview, model, analyzeImage]);

  // 4. Lógica del Mini-Mapa
  useEffect(() => {
    if (showMiniMap && miniMapContainer.current && !miniMap.current) {
      miniMap.current = new maplibregl.Map({
        container: miniMapContainer.current,
        style: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${import.meta.env.VITE_STADIA_API_KEY}`,
        center: [location.lng, location.lat],
        zoom: 14,
        attributionControl: false,
      });

      miniMarker.current = new maplibregl.Marker({ color: "#22c55e" })
        .setLngLat([location.lng, location.lat])
        .addTo(miniMap.current);

      miniMap.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setLocation({ lat, lng });
        miniMarker.current?.setLngLat([lng, lat]);
      });
    }

    if (!showMiniMap && miniMap.current) {
      miniMap.current.remove();
      miniMap.current = null;
    }
  }, [showMiniMap, location.lat, location.lng]);

  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setLocation(coords);
        miniMap.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 15 });
        miniMarker.current?.setLngLat([coords.lng, coords.lat]);
      }
    } catch (err) {
      console.error("Error buscando:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones previas
    if (isUnsafe || isAnalyzing || !title || !caption || !image) {
      alert(
        "Por favor, completa todos los campos y espera a que la IA verifique la imagen.",
      );
      return;
    }

    const formData = new FormData();

    // 1. Añadimos primero los textos
    formData.append("title", title.trim());
    formData.append("description", caption.trim());
    formData.append("user_id", String(user?.id)); // Nest lo convertirá a Int
    formData.append("lat", String(location.lat));
    formData.append("lng", String(location.lng));
    formData.append("category", "general"); // Campo obligatorio en tu DB

    // 2. Añadimos la imagen al final con la clave EXACTA 'image'
    if (image) {
      formData.append("image", image);
    }

    try {
      setIsAnalyzing(true); // Bloqueamos el botón mientras sube

      // Enviamos la petición
      const response = await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Respuesta servidor:", response.data);

      if (response.data) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      }
    } catch (error: any) {
      console.error("Error detallado:", error.response?.data || error.message);
      alert(
        "Error al publicar: " +
          (error.response?.data?.message || "Servidor no disponible"),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay blur">
        <div className="success-container">
          <div className="check-wrapper">
            <CheckCircle2 size={80} className="check-icon-anim" />
          </div>
          <h2 className="success-title">¡PUBLICADO!</h2>
          <p className="success-text">
            Tu descubrimiento ya es parte del mapa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay blur">
      <div className="create-post-content">
        <div className="modal-header">
          <h3>NUEVA PUBLICACIÓN</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <div
            className="upload-section"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-container">
                <img
                  src={preview}
                  alt="Preview"
                  ref={imgRef}
                  className={isUnsafe ? "blur-unsafe" : ""}
                />
                {isAnalyzing && (
                  <div className="analyzing-overlay">
                    <Loader2 className="spin" size={24} />
                    <span>VERIFICANDO...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="upload-placeholder">
                <Camera size={40} />
                <p>AÑADIR FOTO</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              hidden
            />
          </div>

          <div className="location-picker-container">
            <label>UBICACIÓN DEL EVENTO</label>
            <div className="location-search-field">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Busca un lugar o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
              />
              <button
                type="button"
                className={`map-toggle-btn ${showMiniMap ? "active" : ""}`}
                onClick={() => setShowMiniMap(!showMiniMap)}
              >
                <MapIcon size={16} />
              </button>
            </div>

            {showMiniMap && (
              <div className="mini-map-wrapper">
                <div ref={miniMapContainer} className="mini-map-instance" />
                <p className="mini-map-hint">Haz click para ajustar el punto</p>
              </div>
            )}

            <div
              className={`location-status-badge ${location.lat !== 40.4167 ? "ready" : "searching"}`}
            >
              <Navigation size={12} />
              <span>{isLocating ? "Localizando..." : "Ubicación fijada"}</span>
            </div>
          </div>

          {isUnsafe && (
            <div className="unsafe-warning">
              <ShieldAlert size={20} />
              <span>Contenido restringido.</span>
            </div>
          )}

          <div className="form-group">
            <label>TÍTULO</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Graffiti en Malasaña"
              required
            />
          </div>

          <div className="form-group">
            <label>DESCRIPCIÓN</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="¿Qué lo hace especial?"
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-post-btn"
            disabled={
              isUnsafe || isAnalyzing || isLocating || !title || !caption
            }
          >
            {isAnalyzing ? "REVISANDO..." : "PUBLICAR"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
