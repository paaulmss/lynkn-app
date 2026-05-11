import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  ShieldAlert,
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
  const { t } = useTranslation();

  // Lógica de bloqueo de seguridad
  const isLocked = user?.role !== "admin" && user?.status_verif !== "approved";

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

  const isDarkMode = localStorage.getItem("theme") !== "light";

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
      const styleName = isDarkMode ? "alidade_smooth_dark" : "alidade_smooth";

      miniMap.current = new maplibregl.Map({
        container: miniMapContainer.current,
        style: `https://tiles.stadiamaps.com/styles/${styleName}.json?api_key=${import.meta.env.VITE_STADIA_API_KEY}`,
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

      setTimeout(() => miniMap.current?.resize(), 100);
    }

    return () => {
      if (!showMiniMap && miniMap.current) {
        miniMap.current.remove();
        miniMap.current = null;
      }
    };
  }, [showMiniMap, isDarkMode, location.lat, location.lng]);

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
      console.error("Error buscando ubicación:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(t("create_post.err_size"), {
          description: t("create_post.err_size_desc"),
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
    if (isLocked) return;

    const TOAST_ID = "post-upload";

    if (!isUnlimited && (!maxParticipants || maxParticipants <= 0)) {
      toast.warning(t("create_post.err_quota"), {
        description: t("create_post.err_quota_desc"),
      });
      return;
    }

    if (!title || !caption || !image) {
      toast.warning(t("create_post.err_missing"), {
        description: t("create_post.err_missing_desc"),
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrors({});
      toast.loading(t("create_post.analyzing"), { id: TOAST_ID });

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

      toast.success(t("create_post.success_title"), { id: TOAST_ID });
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch (error) {
      const err = error as ApiError;
      const rawMessage = err.response?.data?.message || "Error";

      const newErrors: { title?: boolean; caption?: boolean; image?: boolean } =
        {};
      const lowerMsg = rawMessage.toLowerCase();

      if (lowerMsg.includes("título") || lowerMsg.includes("title"))
        newErrors.title = true;
      if (lowerMsg.includes("descripción") || lowerMsg.includes("description"))
        newErrors.caption = true;
      if (lowerMsg.includes("imagen") || lowerMsg.includes("image"))
        newErrors.image = true;

      setErrors(newErrors);

      toast.error(t("create_post.err_security"), {
        id: TOAST_ID,
        description: rawMessage.includes("|")
          ? rawMessage.split("|")[1].trim()
          : rawMessage,
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
          <h2 className="success-title">{t("create_post.success_title")}</h2>
          <p className="success-text">{t("create_post.success_desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`modal-overlay blur ${!isDarkMode ? "light-mode" : ""}`}>
      <div className={`create-post-content ${isLocked ? "is-locked" : ""}`}>
        {isLocked && (
          <div className="modal-security-overlay">
            <div className="lock-content">
              <ShieldAlert
                size={48}
                color="var(--text-main)"
                className="lock-icon-neon"
              />
              <h2>{t("create_post.restricted")}</h2>
              <p>{t("create_post.restricted_desc")}</p>
              <button
                className="reverify-btn"
                onClick={() => (window.location.href = "/profile")}
              >
                {t("create_post.go_profile")}
              </button>
            </div>
          </div>
        )}

        <div className="modal-header">
          <h3>{t("create_post.title")}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} color="var(--text-main)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <div
            className={`upload-section ${errors.image ? "input-error" : ""}`}
            onClick={() => !isLocked && fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" />
                {isAnalyzing && (
                  <div className="analyzing-overlay">
                    <Loader2 className="spin" size={24} />
                    <span>{t("create_post.moderating")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="upload-placeholder">
                <Camera size={40} color="var(--text-muted)" />
                <p>{t("create_post.add_photo")}</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              hidden
              disabled={isLocked}
            />
          </div>

          <div className="location-picker-container">
            <label>{t("create_post.loc_label")}</label>
            <div className="location-search-field">
              <Search
                size={16}
                className="search-icon"
                color="var(--text-muted)"
              />
              <input
                type="text"
                placeholder={t("create_post.search_place")}
                value={searchQuery}
                disabled={isLocked}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
              />
              <button
                type="button"
                disabled={isLocked}
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
              <span>
                {isLocating
                  ? t("create_post.loc_searching")
                  : t("create_post.loc_fixed")}
              </span>
            </div>
          </div>

          <div className="form-group">
            <div className="flex-label-header">
              <label>{t("create_post.participants")}</label>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isUnlimited}
                  disabled={isLocked}
                  onChange={(e) => {
                    setIsUnlimited(e.target.checked);
                    if (e.target.checked) setMaxParticipants("");
                  }}
                />
                <span className="checkbox-label">
                  {t("create_post.unlimited")}
                </span>
              </label>
            </div>

            <div
              className={`input-with-icon ${isUnlimited || isLocked ? "disabled-field" : ""}`}
            >
              <Users
                size={16}
                className="field-icon"
                color="var(--text-muted)"
              />
              <input
                type="number"
                min="1"
                placeholder={
                  isUnlimited
                    ? t("create_post.unlimited")
                    : t("create_post.limit_placeholder")
                }
                value={maxParticipants}
                disabled={isUnlimited || isLocked}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "" && parseInt(val) <= 0) return;
                  setMaxParticipants(val === "" ? "" : parseInt(val));
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t("create_post.post_title")}</label>
            <input
              className={errors.title ? "input-error" : ""}
              value={title}
              disabled={isLocked}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: false }));
              }}
              placeholder={t("create_post.title_placeholder")}
              required
            />
          </div>

          <div className="form-group">
            <label>{t("create_post.description")}</label>
            <textarea
              className={errors.caption ? "input-error" : ""}
              value={caption}
              disabled={isLocked}
              onChange={(e) => {
                setCaption(e.target.value);
                if (errors.caption)
                  setErrors((prev) => ({ ...prev, caption: false }));
              }}
              placeholder={t("create_post.desc_placeholder")}
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-post-btn"
            disabled={
              isLocked ||
              isAnalyzing ||
              isLocating ||
              !title ||
              !caption ||
              !image
            }
          >
            {isLocked
              ? t("common.locked")
              : isAnalyzing
                ? t("create_post.analyzing")
                : t("create_post.submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
