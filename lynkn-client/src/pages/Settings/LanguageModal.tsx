import React from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth'; // Importamos el hook de auth
import "./LanguageModal.css";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages = [
  { code: 'es', nameKey: 'settings.languages.es', flag: '🇪🇸' },
  { code: 'en', nameKey: 'settings.languages.en', flag: '🇺🇸' }
] as const; // 'as const' ayuda a que TS sepa que estos valores son fijos

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user, updatePreferences } = useAuth(); // Extraemos lo necesario
  
  if (!isOpen) return null;

  const isDarkMode = user?.theme !== "light";

  const handleLanguageChange = async (code: string) => {
    await updatePreferences(
      user?.theme || 'dark', 
      code as 'es' | 'en'
    );
    onClose();
  };

  return (
    <div className={`modal-overlay blur ${!isDarkMode ? 'light-mode' : ''}`} onClick={onClose}>
      <div className="language-modal-content" onClick={e => e.stopPropagation()}>
        <div className="language-modal-header">
          <h3>{t('settings.interface_lang')}</h3> 
          <button className="close-btn" onClick={onClose}>
            <X size={20} color="var(--text-main)" />
          </button>
        </div>

        <div className="languages-list">
          {languages.map((lang) => (
            <div 
              key={lang.code} 
              className={`language-item ${i18n.language.startsWith(lang.code) ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <div className="lang-info">
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-name">{t(lang.nameKey)}</span>
              </div>
              {i18n.language.startsWith(lang.code) && (
                <Check size={18} color={isDarkMode ? "var(--neon-glow)" : "#000"} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
