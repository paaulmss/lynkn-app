import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react"; 
import { X, UploadCloud, User, MapPin, AlignLeft } from "lucide-react";
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
  onSuccess: () => void;
}

const EditProfileModal = ({ user, onClose, onSuccess }: EditProfileModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(user?.foto_perfil || "https://via.placeholder.com/150");
  
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
        alert("La imagen es demasiado grande. Máximo 2MB.");
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
      alert("El nombre de usuario es obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/users/${user.id}/profile`, formData);
      
      onSuccess(); 
      onClose();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("No se pudieron guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay blur" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>EDITAR PERFIL</h3>
          <button className="close-btn" onClick={onClose} type="button">
            <X size={20} color="white" />
          </button>
        </div>
        
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="edit-avatar-section">
            <div className="avatar-preview-wrapper" onClick={() => fileInputRef.current?.click()}>
              <img 
                src={previewImage} 
                alt="Vista previa perfil" 
                className="avatar-preview-img" 
                onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150" }}
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
              CAMBIAR FOTO
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
            <label><User size={14} /> NOMBRE DE USUARIO</label>
            <input 
              type="text" 
              placeholder="Tu nombre público..."
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required
              maxLength={25}
            />
          </div>

          <div className="form-group">
            <label><MapPin size={14} /> UBICACIÓN</label>
            <input 
              type="text" 
              placeholder="Ej: Madrid, España"
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label><AlignLeft size={14} /> BIO</label>
            <textarea 
              placeholder="Cuéntanos un poco sobre ti..."
              value={formData.bio} 
              onChange={(e) => setFormData({...formData, bio: e.target.value})} 
              rows={3}
              maxLength={160}
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
              CANCELAR
            </button>
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;