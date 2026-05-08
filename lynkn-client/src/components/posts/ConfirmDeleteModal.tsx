import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  isOpen, onClose, onConfirm, title, isLoading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="confirm-modal-icon">
          <AlertTriangle size={40} color="#ef4444" />
        </div>

        <h3>¿ELIMINAR PUBLICACIÓN?</h3>
        <p>Estás a punto de borrar <strong>"{title}"</strong>. Esta acción eliminará permanentemente el chat, los participantes y las notificaciones asociadas.</p>

        <div className="confirm-modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>
            CANCELAR
          </button>
          <button className="btn-confirm-delete" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "ELIMINANDO..." : "SÍ, ELIMINAR TODO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;