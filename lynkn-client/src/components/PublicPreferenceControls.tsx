import { Languages, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyThemePreference,
  getNextLanguage,
  getNextTheme,
  readThemePreference,
  type ThemePreference,
} from "../utils/publicPreferences";
import "./PublicPreferenceControls.css";

interface PublicPreferenceControlsProps {
  className?: string;
}

const normalizeLanguage = (lng: string) => (lng.startsWith("es") ? "es" : "en");

const PublicPreferenceControls = ({ className = "" }: PublicPreferenceControlsProps) => {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference());
  const [language, setLanguage] = useState(() => normalizeLanguage(i18n.resolvedLanguage || i18n.language || "es"));

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    const syncLanguage = (lng: string) => setLanguage(normalizeLanguage(lng));
    syncLanguage(i18n.resolvedLanguage || i18n.language || "es");
    i18n.on("languageChanged", syncLanguage);
    return () => {
      i18n.off("languageChanged", syncLanguage);
    };
  }, [i18n]);

  const toggleTheme = () => {
    setTheme((current) => getNextTheme(current));
  };

  const toggleLanguage = async () => {
    const nextLanguage = getNextLanguage(language);
    await i18n.changeLanguage(nextLanguage);
    localStorage.setItem("i18nextLng", nextLanguage);
    document.documentElement.lang = nextLanguage;
    setLanguage(nextLanguage);
  };

  return (
    <div className={`public-pref-controls ${className}`} aria-label="Preferencias públicas">
      <button
        type="button"
        className="public-pref-btn"
        onClick={toggleLanguage}
        aria-label="Cambiar idioma"
        title="Cambiar idioma"
      >
        <Languages size={16} />
        <span>{language.toUpperCase()}</span>
      </button>
      <button
        type="button"
        className="public-pref-btn"
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        title="Cambiar tema"
      >
        {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
};

export default PublicPreferenceControls;
