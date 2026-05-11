import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react"; // Importamos el icono para el error
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import "./Login.css";

const GoogleCustomButton = () => {
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await authService.loginWithGoogle(
          tokenResponse.access_token,
        );
        login(data);
      } catch (error) {
        console.error("Error enviando token a NestJS:", error);
      }
    },
    onError: () => console.log("Error en el login de Google"),
  });

  return (
    <button
      type="button"
      onClick={() => handleGoogleLogin()}
      className="btn-google-login"
    >
      <img
        src="https://rotulosmatesanz.com/wp-content/uploads/2017/09/2000px-Google_G_Logo.svg_.png"
        alt="Google"
        className="google-icon"
      />
      {t('auth.login.btn_google')}
    </button>
  );
};

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Estado para el error visual
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null); // Limpiamos errores previos al intentar de nuevo

    try {
      const data = await authService.loginManual({ identifier, password });
      login(data);
    } catch (error: unknown) {
      // 1. Tipamos el error como el objeto que devuelve Axios/NestJS
      const err = error as { 
        response?: { 
          data?: { 
            message?: string 
          } 
        } 
      };

      const serverCode = err.response?.data?.message;
      
      // 3. Mapeamos a la traducción
      const translatedMessage = t(`auth.errors.${serverCode}`, { 
        defaultValue: t("auth.login.error_default") 
      });

      setErrorMsg(translatedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="TU_CLIENT_ID_REAL">
      <div className="login-container">
        <div className="login-bg-image"></div>
        <div className="login-overlay"></div>

        <div className="login-card">
          <h1 className="login-logo">LYNKN</h1>
          <p className="login-subtitle">{t('auth.login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="login-form">
            
            {/* BLOQUE DE ERROR VISUAL */}
            {errorMsg && (
              <div className="nomad-ui-error animate-in" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group-login">
              <input
                type="text"
                placeholder={t('auth.login.identifier_placeholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="form-group-login">
              <input
                type="password"
                placeholder={t('auth.login.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading ? t('auth.login.btn_verifying') : t('auth.login.submit')}
            </button>

            <div className="login-separator">
              <span>{t('common.or') || 'O'}</span>
            </div>

            <div className="google-wrapper">
              <GoogleCustomButton />
            </div>
          </form>

          <div className="login-footer">
            <span>{t('auth.login.no_account')}</span>
            <Link to="/register" className="link-to-register">
              {t('auth.login.link_register')}
            </Link>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;