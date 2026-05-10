import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { io, Socket } from "socket.io-client";
import {
  ChevronRight,
  ChevronLeft,
  Camera,
  Smartphone,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import api from "../../api/axiosConfig";
import { loadModels, compareFaces } from "../../services/faceRecognition";
import "./Register.css";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const Register = () => {
  const [step, setStep] = useState(1);
  const [isValidatingFace, setIsValidatingFace] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(false);

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

  // --- LOGICA DE FORTALEZA DE CONTRASEÑA ---
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const getStrengthColor = (score: number) => {
    if (score < 50) return "#ef4444";
    if (score < 75) return "#f59e0b";
    return "#00f2ff";
  };

  const pwdScore = calculatePasswordStrength(formData.password);

  // --- CONFIGURACIÓN DE VERIFICACIÓN REMOTA ---
  const [sessionId] = useState(() => `lynkn_verify_${Date.now()}`);
  const [showCamera, setShowCamera] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SERVER_URL = "https://lynkn-backend.onrender.com";

  useEffect(() => {
    loadModels()
      .then(() => console.log("IA Preparada"))
      .catch((err: Error) => {
        console.error("Error modelos:", err);
        setErrorMsg("Error al cargar motores de IA.");
      });
  }, []);

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

  useEffect(() => {
    const validateAutomatically = async () => {
      if (previews.foto_perfil && previews.selfie) {
        setIsValidatingFace(true);
        setFaceMatchStatus("idle");
        setErrorMsg(null);
        try {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          const isSamePerson = await compareFaces(
            previews.foto_perfil,
            previews.selfie,
          );
          if (isSamePerson) {
            setFaceMatchStatus("success");
          } else {
            setFaceMatchStatus("error");
            setErrorMsg("La identidad no coincide. Repite el selfie.");
          }
        } catch (err) {
          const error = err as Error;
          setFaceMatchStatus("error");
          setErrorMsg(
            error.message.includes("rostro claro")
              ? "No se detecta un rostro."
              : "Error en el escaneo.",
          );
        } finally {
          setIsValidatingFace(false);
        }
      }
    };
    validateAutomatically();
  }, [previews.foto_perfil, previews.selfie]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({
          ...prev,
          [e.target.name]: reader.result as string,
        }));
        setFaceMatchStatus("idle");
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- VALIDACION DE EDAD Y DISPONIBILIDAD (PASO 1) ---
  const handleNextStep = async () => {
    setErrorMsg(null);

    // 1. Validar Edad
    if (!formData.birth_day) {
      return setErrorMsg("La fecha de nacimiento es obligatoria.");
    }
    const birthDate = new Date(formData.birth_day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      return setErrorMsg("Debes tener al menos 18 años para unirte.");
    }

    // 2. Validar Disponibilidad en Backend
    setLoadingStep(true);
    try {
      await api.post("/auth/check-availability", {
        email: formData.email,
        username: formData.username,
      });
      setStep(2);
    } catch (error) {
      const err = error as ApiError;
      setErrorMsg(err.response?.data?.message || "Error de validación.");
    } finally {
      setLoadingStep(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setShowQR(false);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
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
        setPreviews((prev) => ({
          ...prev,
          selfie: canvas.toDataURL("image/jpeg", 0.8),
        }));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    }
    setShowCamera(false);
  };

  const handleRetry = () => {
    setPreviews((p) => ({ ...p, selfie: null }));
    setFaceMatchStatus("idle");
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!previews.foto_perfil) {
      return setErrorMsg("La foto de perfil es obligatoria.");
    }

    try {
      await api.post("/auth/register", { ...formData, ...previews });
      alert("¡Cuenta creada!");
      window.location.href = "/login";
    } catch (error) {
      const err = error as ApiError;
      setErrorMsg(err.response?.data?.message || "Error al enviar registro.");
    }
  };

  // Calculo de fecha maxima para el input date (hace 18 años)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  return (
    <div className="nomad-reg-container">
      <div className="nomad-reg-bg"></div>
      <div className="nomad-reg-card">
        <header className="nomad-reg-header">
          <h1 className="nomad-logo">LYNKN</h1>
          <div className="nomad-step-dots">
            <span className={`dot ${step === 1 ? "active" : ""}`}></span>
            <span className={`dot ${step === 2 ? "active" : ""}`}></span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="nomad-reg-form">
          {step === 1 && (
            <div className="nomad-step animate-in">
              <h2 className="step-title">DATOS BÁSICOS</h2>
              <div className="nomad-input-group">
                <input
                  type="text"
                  name="username"
                  placeholder="USUARIO"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="nomad-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="EMAIL"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="nomad-input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="CONTRASEÑA"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {formData.password && (
                  <div className="pwd-strength-container">
                    <div className="strength-bar-bg">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${pwdScore}%`,
                          backgroundColor: getStrengthColor(pwdScore),
                        }}
                      ></div>
                    </div>
                    <span
                      className="strength-label"
                      style={{ color: getStrengthColor(pwdScore) }}
                    >
                      {pwdScore < 50
                        ? "DÉBIL"
                        : pwdScore < 100
                          ? "MEDIA"
                          : "FUERTE"}
                    </span>
                  </div>
                )}
              </div>
              <div className="nomad-input-group">
                <label className="nomad-label">FECHA NACIMIENTO</label>
                <input
                  type="date"
                  name="birth_day"
                  max={maxDateString}
                  value={formData.birth_day}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {errorMsg && (
                <div
                  className="nomad-ui-error animate-in"
                  style={{ marginBottom: "1rem" }}
                >
                  <AlertCircle size={14} /> <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                className="nomad-btn-primary"
                onClick={handleNextStep}
                disabled={pwdScore < 50 || loadingStep}
              >
                {loadingStep ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    CONTINUAR <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="nomad-step animate-in">
              <h2 className="step-title">IDENTIDAD</h2>
              <div className="avatar-picker">
                <input
                  type="file"
                  name="foto_perfil"
                  id="fp"
                  className="hidden-input"
                  onChange={handleFileChange}
                />
                <label htmlFor="fp" className="avatar-circle">
                  {previews.foto_perfil ? (
                    <img src={previews.foto_perfil} alt="P" />
                  ) : (
                    <span>+</span>
                  )}
                </label>
              </div>

              <div className="nomad-verification-box">
                <div className="nomad-verify-header">
                  <label className="nomad-label">BIO-MÉTRICA</label>
                  {faceMatchStatus === "success" && (
                    <ShieldCheck size={18} color="#22c55e" />
                  )}
                  {faceMatchStatus === "error" && (
                    <ShieldAlert size={18} color="#ef4444" />
                  )}
                </div>

                {previews.selfie ? (
                  <div
                    className={`selfie-preview-box ${isValidatingFace ? "scanning" : ""} ${faceMatchStatus}`}
                  >
                    <img src={previews.selfie} alt="S" />
                    <div className="scan-line"></div>
                    <button
                      type="button"
                      className="nomad-btn-retry"
                      onClick={handleRetry}
                    >
                      <RefreshCw size={14} /> REPETIR
                    </button>
                  </div>
                ) : (
                  <div className="nomad-verify-methods">
                    {!showCamera && !showQR && (
                      <div className="method-btns">
                        <button
                          type="button"
                          className="method-btn"
                          onClick={startCamera}
                        >
                          <Camera size={18} /> CÁMARA
                        </button>
                        <button
                          type="button"
                          className="method-btn"
                          onClick={() => setShowQR(true)}
                        >
                          <Smartphone size={18} /> MÓVIL
                        </button>
                      </div>
                    )}

                    {showCamera && (
                      <div className="camera-view-container">
                        <video ref={videoRef} autoPlay playsInline muted />
                        <canvas
                          ref={canvasRef}
                          style={{ display: "none" }}
                        ></canvas>
                        <div className="camera-controls">
                          <button
                            type="button"
                            className="btn-capture"
                            onClick={takePhoto}
                          >
                            CAPTURAR
                          </button>
                          <button
                            type="button"
                            className="btn-text-cancel"
                            onClick={stopCamera}
                          >
                            CANCELAR
                          </button>
                        </div>
                      </div>
                    )}

                    {showQR && (
                      <div className="qr-view-container">
                        {isReceiving ? (
                          <div className="nomad-loader-box">
                            <div className="nomad-spinner"></div>
                            <span style={{ color: "#fff", fontSize: "0.7rem" }}>
                              RECIBIENDO...
                            </span>
                          </div>
                        ) : (
                          <div className="qr-wrapper">
                            <QRCode
                              value={`${window.location.origin}/verify/${sessionId}`}
                              size={140}
                              fgColor="#000"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn-text-cancel"
                          onClick={() => setShowQR(false)}
                        >
                          VOLVER
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {errorMsg && (
                  <div className="nomad-ui-error animate-in">
                    <AlertCircle size={14} /> <span>{errorMsg}</span>
                  </div>
                )}
                {faceMatchStatus === "success" && !isValidatingFace && (
                  <div className="nomad-ui-success animate-in">
                    <ShieldCheck size={14} /> <span>IDENTIDAD VERIFICADA</span>
                  </div>
                )}
              </div>

              <div
                className="nomad-footer-btns"
                style={{ flexDirection: "column", gap: "15px" }}
              >
                <div style={{ display: "flex", width: "100%", gap: "20px" }}>
                  <button
                    type="button"
                    className="nomad-btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft size={18} /> ATRÁS
                  </button>

                  <button
                    type="submit"
                    className="nomad-btn-primary"
                    disabled={
                      isValidatingFace ||
                      (faceMatchStatus !== "success" &&
                        faceMatchStatus !== "idle")
                    }
                  >
                    {isValidatingFace ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />{" "}
                        ESCANEANDO...
                      </>
                    ) : (
                      "FINALIZAR"
                    )}
                  </button>
                </div>

                {faceMatchStatus !== "success" && !isValidatingFace && (
                  <button
                    type="button"
                    className="btn-text-cancel"
                    style={{ fontSize: "0.7rem", opacity: 0.8 }}
                    onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                      if (
                        window.confirm(
                          "Si no te verificas ahora, no podrás unirte a eventos hasta que lo hagas desde tu perfil.",
                        )
                      ) {
                        handleSubmit(e as unknown as React.FormEvent);
                      }
                    }}
                  >
                    VERIFICAR IDENTIDAD MÁS TARDE
                  </button>
                )}
              </div>
            </div>
          )}
        </form>

        <div
          className="login-footer"
          style={{ marginTop: "2rem", textAlign: "center" }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
            ¿Ya eres miembro?{" "}
          </span>
          <Link
            to="/login"
            className="link-to-register"
            style={{
              fontWeight: "bold",
              color: "#00f2ff",
              textDecoration: "none",
            }}
          >
            ENTRAR
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
