import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import './DeleteAccountModal.css';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
}

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, username }: DeleteAccountModalProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [inputValue, setInputValue] = useState('');

  // Detectar tema actual
  const isDarkMode = localStorage.getItem("theme") !== "light";

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setInputValue('');
    onClose();
  };

  return (
    <div className={`modal-overlay blur ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className={`delete-modal-content step-${step}`} onClick={(e) => e.stopPropagation()}>
        <header className="delete-modal-header">
          <div className="header-title-group danger">
            <AlertTriangle size={24} color="#ef4444" />
            <span>{step === 1 ? t('delete_modal.title_step1') : t('delete_modal.title_step2')}</span>
          </div>
          
          <button onClick={handleClose} className="close-btn-modal">
            <X size={20} color="var(--text-main)" />
          </button>
        </header>

        <div className="delete-modal-body">
          {step === 1 ? (
            <div className="step-content">
              <p className="warning-text">
                {t('delete_modal.warning')}
              </p>
              <div className="danger-info-box">
                <small>{t('delete_modal.continue_q')}</small>
              </div>
            </div>
          ) : (
            <div className="step-content">
              <p className="instruction-text">
                {t('delete_modal.instruction')}
                <span className="user-highlight">{username}</span>
              </p>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('delete_modal.placeholder')}
                className="delete-input"
                autoFocus
              />
            </div>
          )}
        </div>

        <footer className="delete-modal-footer">
          {step === 1 ? (
            <>
              <button onClick={handleClose} className="btn-secondary">{t('common.cancel')}</button>
              <button onClick={() => setStep(2)} className="btn-danger-next">
                {t('delete_modal.btn_sure')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn-secondary">{t('common.back')}</button>
              <button 
                onClick={onConfirm} 
                className="btn-confirm-final"
                disabled={inputValue !== username}
              >
                <Trash2 size={16} /> {t('delete_modal.btn_final')}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default DeleteAccountModal;