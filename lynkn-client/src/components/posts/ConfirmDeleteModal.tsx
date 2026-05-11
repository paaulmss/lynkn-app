import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  
  if (!isOpen) return null;

  const isDarkMode = user?.theme !== "light";

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className={`confirm-modal-content ${!isDarkMode ? 'light-mode' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onClose}>
          <X size={20} color={isDarkMode ? "#ffffff" : "#000000"} />
        </button>
        
        <div className="confirm-modal-icon">
          <AlertTriangle size={48} color="#ef4444" />
        </div>

        <h3>{t('confirm_delete.title')}</h3>
        <p 
          dangerouslySetInnerHTML={{ 
            __html: t('confirm_delete.warning', { title }) 
          }} 
        />

        <div className="confirm-modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </button>
          <button className="btn-confirm-delete" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('confirm_delete.btn_loading') : t('confirm_delete.btn_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;