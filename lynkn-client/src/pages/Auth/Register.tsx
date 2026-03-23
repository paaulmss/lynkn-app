import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import { io, Socket } from "socket.io-client";
import { ChevronRight, ChevronLeft, Camera, Smartphone, RefreshCw, Loader2, ShieldCheck, ShieldAlert, AlertCircle } from "lucide-react";
import api from "../../api/axiosConfig";
import { loadModels, compareFaces } from "../../services/faceRecognition";
import "./Register.css";

const Register = () => {
  const [step, setStep] = useState(1);
  const [isValidatingFace, setIsValidatingFace] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    birth_day: "",
  });

  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({
    foto_perfil: null,
    selfie: null,
  });

  // --- CONFIGURACIÓN DE VERIFICACIÓN REMOTA ---
  const [sessionId] = useState(() => `lynkn_verify_${Date.now()}`);
  const [showCamera, setShowCamera] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SERVER_URL = "https://lynkn-backend.onrender.com";

  // Cargar modelos de IA
  useEffect(() => {
    loadModels()
      .then(() => console.log("IA Preparada"))
      .catch((err) => {
        console.error("Error modelos:", err);
        setErrorMsg("Error al cargar motores de IA.");
      });
  }, []);

  // Lógica de Sockets para recibir selfie del móvil
  useEffect(() => {
    if (!showQR) return;

    const socket: Socket = io(SERVER_URL, {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join-session", sessionId);
    });

    socket.on("receive-selfie", (imageBase64: string) => {
      setIsReceiving(true);
      setPreviews((prev) => ({ ...prev, selfie: imageBase64 }));
      setIsReceiving(false);
      setShowQR(false);
      setErrorMsg(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [showQR, sessionId, SERVER_URL]);

  // Validación Biométrica Automática
  useEffect(() => {
    const validateAutomatically = async () => {
      if (previews.foto_perfil && previews.selfie) {
        setIsValidatingFace(true);
        setFaceMatchStatus('idle');
        setErrorMsg(null);

        try {
          // Pequeña espera para mostrar la animación de escaneo
          await new Promise(resolve => setTimeout(resolve, 1200));
          const isSamePerson = await compareFaces(previews.foto_perfil, previews.selfie);
          
          if (isSamePerson) {
            setFaceMatchStatus('success');
          } else {
            setFaceMatchStatus('error');
            setErrorMsg("La identidad no coincide. Repite el selfie.");
          }
        } catch (err: any) {
          setFaceMatchStatus('error');
          if (err.message.includes("rostro claro")) {
            setErrorMsg("No se detecta un rostro. Busca mejor luz.");
          } else {
            setErrorMsg("Error en el escaneo facial.");
          }
        } finally {
          setIsValidatingFace(false);
        }
      }
    };
    validateAutomatically();
  }, [previews.foto_perfil, previews.selfie]);

  // --- MANEJADORES ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [e.target.name]: reader.result as string }));
        setFaceMatchStatus('idle');
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setShowQR(false);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setErrorMsg("Cámara no disponible.");
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx && video.readyState === 4) {
        ctx.drawImage(video, 0, 0);
        setPreviews((prev) => ({ ...prev, selfie: canvas.toDataURL("image/jpeg", 0.8) }));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const handleRetry = () => {
    setPreviews(p => ({ ...p, selfie: null }));
    setFaceMatchStatus('idle');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (faceMatchStatus !== 'success') return setErrorMsg("Verificación obligatoria.");
    
    try {
      await api.post("/auth/register", { ...formData, ...previews });
      alert("¡Cuenta creada!");
      window.location.href = "/login";
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Error al enviar registro.");
    }
  };

  return (
    <div className="nomad-reg-container">
      <div className="nomad-reg-bg"></div>
      <div className="nomad-reg-card">
        <header className="nomad-reg-header">
          <h1 className="nomad-logo">LYNKN</h1>
          <div className="nomad-step-dots">
            <span className={`dot ${step === 1 ? 'active' : ''}`}></span>
            <span className={`dot ${step === 2 ? 'active' : ''}`}></span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="nomad-reg-form">
          {step === 1 && (
            <div className="nomad-step animate-in">
              <h2 className="step-title">DATOS BÁSICOS</h2>
              <div className="nomad-input-group"><input type="text" name="username" placeholder="USUARIO" onChange={handleInputChange} required /></div>
              <div className="nomad-input-group"><input type="email" name="email" placeholder="EMAIL" onChange={handleInputChange} required /></div>
              <div className="nomad-input-group"><input type="password" name="password" placeholder="CONTRASEÑA" onChange={handleInputChange} required /></div>
              <div className="nomad-input-group">
                <label className="nomad-label">FECHA NACIMIENTO</label>
                <input type="date" name="birth_day" onChange={handleInputChange} required />
              </div>
              <button type="button" className="nomad-btn-primary" onClick={() => setStep(2)}>CONTINUAR <ChevronRight size={18} /></button>
            </div>
          )}

          {step === 2 && (
            <div className="nomad-step animate-in">
              <h2 className="step-title">IDENTIDAD</h2>
              <div className="avatar-picker">
                <input type="file" name="foto_perfil" id="fp" className="hidden-input" onChange={handleFileChange} required />
                <label htmlFor="fp" className="avatar-circle">
                  {previews.foto_perfil ? <img src={previews.foto_perfil} alt="P" /> : <span>+</span>}
                </label>
              </div>

              <div className="nomad-verification-box">
                <div className="nomad-verify-header">
                  <label className="nomad-label">BIO-MÉTRICA</label>
                  {faceMatchStatus === 'success' && <ShieldCheck size={18} color="#22c55e" />}
                  {faceMatchStatus === 'error' && <ShieldAlert size={18} color="#ef4444" />}
                </div>

                {previews.selfie ? (
                  <div className={`selfie-preview-box ${isValidatingFace ? 'scanning' : ''} ${faceMatchStatus}`}>
                    <img src={previews.selfie} alt="S" />
                    <div className="scan-line"></div>
                    <button type="button" className="nomad-btn-retry" onClick={handleRetry}>
                      <RefreshCw size={14} /> REPETIR
                    </button>
                  </div>
                ) : (
                  <div className="nomad-verify-methods">
                    {!showCamera && !showQR && (
                      <div className="method-btns">
                        <button type="button" className="method-btn" onClick={startCamera}><Camera size={18} /> CÁMARA</button>
                        <button type="button" className="method-btn" onClick={() => setShowQR(true)}><Smartphone size={18} /> MÓVIL</button>
                      </div>
                    )}

                    {showCamera && (
                      <div className="camera-view-container">
                        <video ref={videoRef} autoPlay playsInline muted />
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        <div className="camera-controls">
                          <button type="button" className="btn-capture" onClick={takePhoto}>CAPTURAR</button>
                          <button type="button" className="btn-text-cancel" onClick={stopCamera}>CANCELAR</button>
                        </div>
                      </div>
                    )}

                    {showQR && (
                      <div className="qr-view-container">
                        {isReceiving ? (
                          <div className="nomad-loader-box">
                            <div className="nomad-spinner"></div>
                            <span style={{color: '#fff', fontSize: '0.7rem'}}>RECIBIENDO...</span>
                          </div>
                        ) : (
                          <div className="qr-wrapper">
                            <QRCode value={`${window.location.origin}/verify/${sessionId}`} size={140} fgColor="#000" />
                          </div>
                        )}
                        <button type="button" className="btn-text-cancel" onClick={() => setShowQR(false)}>VOLVER</button>
                      </div>
                    )}
                  </div>
                )}

                {errorMsg && (
                  <div className="nomad-ui-error animate-in">
                    <AlertCircle size={14} /> <span>{errorMsg}</span>
                  </div>
                )}
                {faceMatchStatus === 'success' && !isValidatingFace && (
                  <div className="nomad-ui-success animate-in">
                    <ShieldCheck size={14} /> <span>IDENTIDAD VERIFICADA</span>
                  </div>
                )}
              </div>

              <div className="nomad-footer-btns">
                <button type="button" className="nomad-btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={18} /> ATRÁS</button>
                <button type="submit" className="nomad-btn-primary" disabled={isValidatingFace || faceMatchStatus !== 'success'}>
                  {isValidatingFace ? <><Loader2 className="animate-spin" size={18} /> ESCANEANDO...</> : "FINALIZAR"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;