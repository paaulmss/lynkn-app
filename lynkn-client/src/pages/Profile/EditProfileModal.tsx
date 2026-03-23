import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react"; 
import { X, UploadCloud } from "lucide-react";
import api from "../../api/axiosConfig";
import "./EditProfileModal.css";

//Definimos qué forma tiene el usuario que recibimos
interface User {
  id: string | number;
  username: string;
  bio?: string;
  location?: string;
  foto_perfil?: string;
}

//Definimos las props del componente
interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProfileModal = ({ user, onClose, onSuccess }: EditProfileModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(user?.foto_perfil || "");
  
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    foto_perfil: user?.foto_perfil || ""
  });

  // Tipamos el evento de cambio de archivo
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setFormData({ ...formData, foto_perfil: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // Tipamos el evento de envío del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/users/${user.id}/profile`, formData);
      onSuccess(); 
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Error al guardar los cambios.");
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
        <X size={20} color="black"/>
          </button>
        </div>
        
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="edit-avatar-section">
            <div className="avatar-preview-wrapper" onClick={() => fileInputRef.current?.click()}>
              <img src={previewImage} alt="Preview" className="avatar-preview-img" />
              <div className="avatar-overlay-icon">
                <UploadCloud size={24} color="white" />
              </div>
            </div>
            <button type="button" className="change-photo-btn" onClick={() => fileInputRef.current?.click()}>
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
            <label>NOMBRE DE USUARIO</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required
            />
          </div>

          <div className="form-group">
            <label>UBICACIÓN</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label>BIO</label>
            <textarea 
              value={formData.bio} 
              onChange={(e) => setFormData({...formData, bio: e.target.value})} 
              rows={3} 
            />
          </div>

          <button type="submit" className="save-btn" disabled={isSaving}>
            {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;