import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import './Login.css';

const GoogleCustomButton = () => {
  const { login } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await authService.loginWithGoogle(tokenResponse.access_token);
        login(data); 
      } catch (error) {
        console.error('Error enviando token a NestJS:', error);
      }
    },
    onError: () => console.log('Error en el login de Google'),
  });

  return (
    <button type="button" onClick={() => handleGoogleLogin()} className="btn-google-login">
      <img 
        src="https://rotulosmatesanz.com/wp-content/uploads/2017/09/2000px-Google_G_Logo.svg_.png" 
        alt="Google" 
        className="google-icon" 
      />
      CONTINUAR CON GOOGLE
    </button>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await authService.loginManual({ email, password });
      login(data); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Credenciales incorrectas";
      alert(errorMessage);
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
          <p className="login-subtitle">Acceso exclusivo al círculo.</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group-login">
              <input 
                type="email" 
                placeholder="EMAIL" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group-login">
              <input 
                type="password" 
                placeholder="CONTRASEÑA" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? 'VERIFICANDO...' : 'ENTRAR'}
            </button>
            
            <div className="login-separator">
              <span>O</span>
            </div>

            <div className="google-wrapper">
              <GoogleCustomButton />
            </div>
          </form>

          <div className="login-footer">
            <span>¿Aún no eres miembro?</span>
            <Link to="/register" className="link-to-register">SOLICITA ACCESO</Link>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;