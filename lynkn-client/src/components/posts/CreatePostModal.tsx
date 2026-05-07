import React, { useState, useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { toast } from "sonner";
import {
  Camera,
  X,
  Loader2,
  CheckCircle2,
  Search,
  Map as MapIcon,
  Navigation,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosConfig";
import "./CreatePostModal.css";

interface ApiError {
  response?: { data?: { message?: string } };
  message: string;
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
  const [isSuccess, setIsSuccess] = useState(false);

  const [isUnlimited, setIsUnlimited] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");

  const [errors, setErrors] = useState<{
    title?: boolean;
    caption?: boolean;
    image?: boolean;
  }>({});

  const [location, setLocation] = useState({ lat: 40.4167, lng: -3.7037 });
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMiniMap, setShowMiniMap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const miniMapContainer = useRef<HTMLDivElement>(null);
  const miniMap = useRef<maplibregl.Map | null>(null);
  const miniMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => setIsLocating(false),
      );
    }
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
  }, [location.lat, location.lng, showMiniMap]);

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
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Imagen demasiado pesada", {
          description:
            "El límite es de 3MB para permitir la validación por IA.",
        });
        return;
      }

      if (preview) URL.revokeObjectURL(preview);
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const TOAST_ID = "post-upload";

    if (!isUnlimited && (!maxParticipants || maxParticipants <= 0)) {
      toast.warning("Define el aforo", {
        description:
          "Si no es ilimitado, debes indicar al menos 1 participante.",
      });
      return;
    }

    if (!title || !caption || !image) {
      toast.warning("Faltan datos", {
        description: "Completa todos los campos obligatorios.",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrors({});
      toast.loading("Verificando seguridad y publicando...", { id: TOAST_ID });

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", caption.trim());
      formData.append("user_id", String(user?.id));
      formData.append("lat", String(location.lat));
      formData.append("lng", String(location.lng));
      formData.append("category", "general");
      formData.append("image", image);
      const finalParticipants = isUnlimited ? 0 : maxParticipants;
      formData.append("max_participants", String(finalParticipants));

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("¡Publicado con éxito!", { id: TOAST_ID });
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch (error) {
      const err = error as ApiError;
      const rawMessage = err.response?.data?.message || "Error de conexión";

      const newErrors: { title?: boolean; caption?: boolean; image?: boolean } =
        {};
      const lowerMsg = rawMessage.toLowerCase();

      if (lowerMsg.includes("título")) newErrors.title = true;
      if (lowerMsg.includes("descripción") || lowerMsg.includes("texto"))
        newErrors.caption = true;
      if (lowerMsg.includes("imagen") || lowerMsg.includes("foto"))
        newErrors.image = true;

      if (
        lowerMsg.includes("todo") ||
        lowerMsg.includes("contenido inapropiado")
      ) {
        newErrors.title = true;
        newErrors.caption = true;
        newErrors.image = true;
      }

      setErrors(newErrors);

      const cleanDescription = rawMessage.includes("|")
        ? rawMessage.split("|")[1].replace("DETAIL:", "").trim()
        : rawMessage;

      toast.error("Rechazado por Seguridad", {
        id: TOAST_ID,
        description: cleanDescription,
      });
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
            className={`upload-section ${errors.image ? "input-error" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" />
                {isAnalyzing && (
                  <div className="analyzing-overlay">
                    <Loader2 className="spin" size={24} />
                    <span>MODERANDO...</span>
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
                placeholder="Busca un lugar..."
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
              </div>
            )}
            <div
              className={`location-status-badge ${location.lat !== 40.4167 ? "ready" : "searching"}`}
            >
              <Navigation size={12} />
              <span>{isLocating ? "Localizando..." : "Ubicación fijada"}</span>
            </div>
          </div>

          <div className="form-group">
            <div className="flex-label-header">
              <label>PARTICIPANTES</label>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isUnlimited}
                  onChange={(e) => {
                    setIsUnlimited(e.target.checked);
                    if (e.target.checked) setMaxParticipants(""); // Limpiamos si marca ilimitado
                  }}
                />
                <span className="checkbox-label">ILIMITADO</span>
              </label>
            </div>

            <div
              className={`input-with-icon ${isUnlimited ? "disabled-field" : ""}`}
            >
              <Users size={16} className="field-icon" />
              <input
                type="number"
                min="1"
                placeholder={isUnlimited ? "Sin límite" : "Ej: 20"}
                value={maxParticipants}
                disabled={isUnlimited}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "" && parseInt(val) <= 0) return;
                  setMaxParticipants(val === "" ? "" : parseInt(val));
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>TÍTULO</label>
            <input
              className={errors.title ? "input-error" : ""}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: false }));
              }}
              placeholder="Ej: Graffiti en Malasaña"
              required
            />
          </div>

          <div className="form-group">
            <label>DESCRIPCIÓN</label>
            <textarea
              className={errors.caption ? "input-error" : ""}
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                if (errors.caption)
                  setErrors((prev) => ({ ...prev, caption: false }));
              }}
              placeholder="¿Qué lo hace especial?"
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-post-btn"
            disabled={isAnalyzing || isLocating || !title || !caption}
          >
            {isAnalyzing ? "VERIFICANDO..." : "PUBLICAR"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
