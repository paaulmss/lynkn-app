import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ChangeEvent, FormEvent } from "react"; 
import { X, UploadCloud, User, MapPin, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/axiosConfig";
import "./EditProfileModal.css";

interface User {
  id: string | number;
  username: string;
  bio?: string;
  location?: string;
  foto_perfil?: string;
}

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
}

const EditProfileModal = ({ user, onClose, onSuccess }: EditProfileModalProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(user?.foto_perfil || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  
  const isDarkMode = localStorage.getItem("theme") !== "light";

  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    foto_perfil: user?.foto_perfil || ""
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('edit_profile.err_size'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData({ ...formData, foto_perfil: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      toast.error(t('edit_profile.err_username'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put(`/users/${user.id}/profile`, formData);
      onSuccess(response.data); 
      onClose();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      const apiError = error as ApiError;
      const message = apiError.response?.data?.message || apiError.response?.data?.error || "";
      if (String(message).includes("PROFILE_CONTENT_REJECTED")) {
        toast.error(t('edit_profile.err_moderation'));
      } else if (String(message).includes("ERR_USERNAME_EXISTS")) {
        toast.error(t('register.errors.ERR_USERNAME_EXISTS'));
      } else {
        toast.error(t('edit_profile.err_save'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`modal-overlay blur ${!isDarkMode ? 'light-mode' : ''}`} onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>{t('edit_profile.title')}</h3>
          <button className="close-btn" onClick={onClose} type="button">
            <X size={20} color="var(--text-main)" />
          </button>
        </div>
        
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="edit-avatar-section">
            <div className="avatar-preview-wrapper" onClick={() => fileInputRef.current?.click()}>
              <img 
                src={previewImage} 
                alt={t('edit_profile.preview_alt')}
                className="avatar-preview-img" 
                onError={(e) => { (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" }}
              />
              <div className="avatar-overlay-icon">
                <UploadCloud size={24} color="white" />
              </div>
            </div>
            <button 
              type="button" 
              className="change-photo-btn" 
              onClick={() => fileInputRef.current?.click()}
            >
              {t('edit_profile.change_photo')}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>

          <div className="form-group">
            <label><User size={14} color="var(--text-muted)" /> {t('edit_profile.username')}</label>
            <input 
              type="text" 
              placeholder={t('edit_profile.username_placeholder')}
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required
              maxLength={25}
              className="edit-input"
            />
          </div>

          <div className="form-group">
            <label><MapPin size={14} color="var(--text-muted)" /> {t('edit_profile.location')}</label>
            <input 
              type="text" 
              placeholder={t('edit_profile.location_placeholder')}
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              maxLength={50}
              className="edit-input"
            />
          </div>

          <div className="form-group">
            <label><AlignLeft size={14} color="var(--text-muted)" /> {t('edit_profile.bio')}</label>
            <textarea 
              placeholder={t('edit_profile.bio_placeholder')}
              value={formData.bio} 
              onChange={(e) => setFormData({...formData, bio: e.target.value})} 
              rows={3}
              maxLength={160}
              className="edit-textarea"
            />
            <small className="char-count">{formData.bio.length}/160</small>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? t('edit_profile.saving') : t('edit_profile.save_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
