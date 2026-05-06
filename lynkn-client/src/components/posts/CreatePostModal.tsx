import React, { useState, useRef, useEffect, useCallback } from "react";
import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { toast } from "sonner";
import {
  Camera,
  X,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Search,
  Map as MapIcon
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosConfig";
import "./CreatePostModal.css";

// --- Interfaces ---
interface ApiError {
  response?: { data?: { message?: string } };
  message: string;
}

interface NSFWPrediction {
  className: "Hentai" | "Porn" | "Sexy" | "Drawing" | "Neutral";
  probability: number;
}

interface NSFWModel {
  classify: (img: HTMLImageElement | HTMLCanvasElement) => Promise<NSFWPrediction[]>;
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
  const [location, setLocation] = useState({ lat: 40.4167, lng: -3.7037 });
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMiniMap, setShowMiniMap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const miniMapContainer = useRef<HTMLDivElement>(null);
  const miniMap = useRef<maplibregl.Map | null>(null);
  const miniMarker = useRef<maplibregl.Marker | null>(null);

  // 1. Analisis de Seguridad de Imagen (Frontend)
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
          p.probability > highProbabilityTrigger
      );
      if (detectedUnsafe) {
        setIsUnsafe(true);
        toast.error("Imagen no permitida", { description: "Se ha detectado contenido explícito." });
      }
    } catch (err) {
      console.error("Error análisis imagen:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [model]);

  // 2. Inicializacion Blindada
  useEffect(() => {
    const initModal = async () => {
      try {
        await tf.ready();
        // Cargamos el modelo solo si no existe para evitar conflictos de backend
        const loadedModel = await nsfwjs.load('MobileNetV2');
        setModel(loadedModel as unknown as NSFWModel);
      } catch {
        console.warn("Fallo carga IA local, se usará validación de servidor.");
      }

      if ("geolocation" in navigator) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setIsLocating(false);
          },
          () => setIsLocating(false)
        );
      }
    };
    initModal();
  }, []);

  // 3. Disparo de analisis al cargar imagen
  useEffect(() => {
    if (preview && model && imgRef.current) {
      const handleLoad = () => analyzeImage();
      const currentImg = imgRef.current;
      currentImg.addEventListener("load", handleLoad);
      return () => currentImg.removeEventListener("load", handleLoad);
    }
  }, [preview, model, analyzeImage]);

  // 4. Logica de Mapa y Busqueda
  useEffect(() => {
    if (showMiniMap && miniMapContainer.current && !miniMap.current) {
      miniMap.current = new maplibregl.Map({
        container: miniMapContainer.current,
        style: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${import.meta.env.VITE_STADIA_API_KEY}`,
        center: [location.lng, location.lat],
        zoom: 14,
        attributionControl: false,
      });
      miniMarker.current = new maplibregl.Marker({ color: "#22c55e" }).setLngLat([location.lng, location.lat]).addTo(miniMap.current);
      miniMap.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        setLocation({ lat, lng });
        miniMarker.current?.setLngLat([lng, lat]);
      });
    }
    return () => { if (miniMap.current) { miniMap.current.remove(); miniMap.current = null; } };
  }, [showMiniMap, location.lat, location.lng]);
  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data?.[0]) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setLocation(coords);
        miniMap.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 15 });
        miniMarker.current?.setLngLat([coords.lng, coords.lat]);
      }
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // 5. ENVIO CON VALIDACION REAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const TOAST_ID = "post-process";

    if (isUnsafe) {
      toast.error("No puedes publicar", { description: "La imagen seleccionada no es segura." });
      return;
    }

    if (!title || !caption || !image) {
      toast.warning("Campos incompletos", { description: "Por favor, rellena todo." });
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.loading("Validando contenido...", { id: TOAST_ID });

      // --- PASO 1: VALIDACION DE TEXTO (GEMINI/OPENAI BACKEND) ---
      const validation = await api.post("/posts/validate-content", {
        text: `${title}. ${caption}`
      });

      if (!validation.data.safe) {
        toast.error("Contenido inapropiado", { 
          id: TOAST_ID, 
          description: "El texto infringe las normas de la comunidad." 
        });
        setIsAnalyzing(false);
        return; 
      }

      // --- PASO 2: SUBIDA ---
      toast.loading("Subiendo publicación...", { id: TOAST_ID });
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", caption.trim());
      formData.append("user_id", String(user?.id));
      formData.append("lat", String(location.lat));
      formData.append("lng", String(location.lng));
      formData.append("image", image);

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("¡Publicado!", { id: TOAST_ID });
      setIsSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2200);

    } catch (error) {
      toast.dismiss(TOAST_ID);
      const err = error as ApiError;
      toast.error("Error al publicar", { description: err.response?.data?.message || "Servidor fuera de línea" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- RENDERIZADO ---
  if (isSuccess) {
    return (
      <div className="modal-overlay blur">
        <div className="success-container">
          <CheckCircle2 size={80} className="check-icon-anim" />
          <h2 className="success-title">¡LISTO!</h2>
          <p className="success-text">Tu post se ha creado correctamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay blur">
      <div className="create-post-content">
        <div className="modal-header">
          <h3>NUEVA PUBLICACIÓN</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="upload-section" onClick={() => fileInputRef.current?.click()}>
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" ref={imgRef} className={isUnsafe ? "blur-unsafe" : ""} />
                {isAnalyzing && <div className="analyzing-overlay"><Loader2 className="spin" /><span>REVISANDO...</span></div>}
              </div>
            ) : (
              <div className="upload-placeholder"><Camera size={40} /><p>AÑADIR FOTO</p></div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
          </div>

          <div className="location-picker-container">
            <div className="location-search-field">
              <Search size={16} />
              <input type="text" placeholder="Lugar del evento..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()} />
              <button type="button" onClick={() => setShowMiniMap(!showMiniMap)}><MapIcon size={16} /></button>
            </div>
            {showMiniMap && <div className="mini-map-wrapper"><div ref={miniMapContainer} className="mini-map-instance" /></div>}
          </div>

          {isUnsafe && (
            <div className="unsafe-warning">
              <ShieldAlert size={20} />
              <span>Imagen bloqueada por seguridad.</span>
            </div>
          )}

          <div className="form-group">
            <label>TÍTULO</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>DESCRIPCIÓN</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} required />
          </div>

          <button type="submit" className="submit-post-btn" disabled={isUnsafe || isAnalyzing || isLocating}>
            {isAnalyzing ? "PROCESANDO..." : "PUBLICAR"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;