import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api/axiosConfig";
import { API_BASE_URL } from "../../api/axiosConfig";
import { loadModels, compareFaces } from "../../services/faceRecognition";
import PublicPreferenceControls from "../../components/PublicPreferenceControls";
import AppLogo from "../../components/AppLogo";
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
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isValidatingFace, setIsValidatingFace] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const isDarkMode = localStorage.getItem("theme") !== "light";

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

  // --- UTILIDADES ---
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const getStrengthLabel = (score: number) => {
    if (score < 50) return t("register.pwd_strength.weak");
    if (score < 100) return t("register.pwd_strength.medium");
    return t("register.pwd_strength.strong");
  };

  const getStrengthColor = (score: number) => {
    if (score < 50) return "#ef4444";
    if (score < 75) return "#f59e0b";
    return "#00f2ff";
  };

  const pwdScore = calculatePasswordStrength(formData.password);
  const [sessionId] = useState(() => `lynkn_verify_${Date.now()}`);
  const [showCamera, setShowCamera] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const SERVER_URL = API_BASE_URL;

  useEffect(() => {
    loadModels()
      .then(() => console.log("IA Preparada"))
      .catch((err: Error) => {
        console.error("Error modelos:", err);
        setErrorMsg(t("register.errors.ai_error"));
      });
  }, [t]);

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
            setErrorMsg(t("register.errors.ai_no_match"));
          }
        } catch (err) {
          const error = err as Error;
          setFaceMatchStatus("error");
          setErrorMsg(
            error.message === "ERR_NO_FACE_DETECTED"
              ? t("register.errors.ai_no_face")
              : t("register.errors.ai_error"),
          );
        } finally {
          setIsValidatingFace(false);
        }
      }
    };
    validateAutomatically();
  }, [previews.foto_perfil, previews.selfie, t]);

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

  const handleNextStep = async () => {
    setErrorMsg(null);
    if (!validateEmail(formData.email))
      return setErrorMsg(t("register.errors.invalid_email"));
    if (!formData.birth_day)
      return setErrorMsg(t("register.errors.birth_required"));

    const birthDate = new Date(formData.birth_day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) return setErrorMsg(t("register.errors.underage"));
    if (!termsAccepted) return setErrorMsg(t("register.errors.terms_required"));

    setLoadingStep(true);
    try {
      await api.post("/auth/check-availability", {
        email: formData.email,
        username: formData.username,
      });
      setStep(2);
    } catch (error: unknown) {
      const err = error as ApiError;
      const serverCode = err.response?.data?.message;
      setErrorMsg(
        t(`auth.errors.${serverCode}`, {
          defaultValue: t("auth.login.error_default"),
        }),
      );
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
      setErrorMsg(t("reverify.cam_error"));
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

  // MODIFICACIÓN: Agregamos parámetro skip para diferenciar caminos
  const handleSubmit = async (
    e?: React.FormEvent,
    skipVerification: boolean = false,
  ) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!previews.foto_perfil)
      return setErrorMsg(t("register.errors.avatar_required"));
    if (!termsAccepted) return setErrorMsg(t("register.errors.terms_required"));

    // Si NO se salta la verificación y no hay éxito, bloqueamos
    if (!skipVerification && faceMatchStatus !== "success") {
      return setErrorMsg(t("register.errors.ai_no_match"));
    }

    try {
      // Si salta la verificación, mandamos selfie como null
      const finalPayload = {
        ...formData,
        foto_perfil: previews.foto_perfil,
        selfie: skipVerification ? null : previews.selfie,
        terms_accepted: termsAccepted,
      };

      await api.post("/auth/register", finalPayload);
      toast.success(t("register.success"));
      window.location.href = "/login";
    } catch (error: unknown) {
      const err = error as ApiError;
      const serverCode = err.response?.data?.message;
      setErrorMsg(
        t(`auth.errors.${serverCode}`, {
          defaultValue: t("edit_profile.err_save"),
        }),
      );
    }
  };

  const maxDateString = new Date(
    new Date().setFullYear(new Date().getFullYear() - 18),
  )
    .toISOString()
    .split("T")[0];

  return (
    <div className={`nomad-reg-container ${!isDarkMode ? "light-mode" : ""}`}>
      <PublicPreferenceControls className="public-pref-floating" />
      <div className="nomad-reg-bg"></div>
      <div className="nomad-reg-card">
        <header className="nomad-reg-header">
          <AppLogo className="auth-logo" />
          <div className="nomad-step-dots">
            <span className={`dot ${step === 1 ? "active" : ""}`}></span>
            <span className={`dot ${step === 2 ? "active" : ""}`}></span>
          </div>
        </header>

        <form
          onSubmit={(e) => handleSubmit(e, false)}
          className="nomad-reg-form"
        >
          {step === 1 && (
            <div className="nomad-step animate-in">
              <h2 className="step-title">{t("register.step_basic")}</h2>
              <div className="nomad-input-group">
                <input
                  type="text"
                  name="username"
                  placeholder={t("register.placeholders.username")}
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="nomad-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder={t("register.placeholders.email")}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="nomad-input-group">
                <input
                  type="password"
                  name="password"
                  placeholder={t("register.placeholders.password")}
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
                      {getStrengthLabel(pwdScore)}
                    </span>
                  </div>
                )}
              </div>
              <div className="nomad-input-group">
                <label className="nomad-label">
                  {t("register.placeholders.birth")}
                </label>
                <div className="date-input-wrapper">
                  <input
                    ref={birthDateRef}
                    type="date"
                    name="birth_day"
                    max={maxDateString}
                    value={formData.birth_day}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="date-picker-btn"
                    aria-label={t("register.placeholders.birth")}
                    onClick={() => {
                      const input = birthDateRef.current;
                      if (!input) return;
                      if (typeof input.showPicker === "function") {
                        input.showPicker();
                      } else {
                        input.focus();
                      }
                    }}
                  >
                    <CalendarDays size={18} />
                  </button>
                </div>
              </div>

              <label className="terms-check-row">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  {t("register.terms.accept_prefix")}{" "}
                  <button
                    type="button"
                    className="terms-link-btn"
                    onClick={() => setIsTermsOpen(true)}
                  >
                    {t("register.terms.link")}
                  </button>
                </span>
              </label>

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
                    {t("common.continue")} <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="nomad-step animate-in">
              <h2 className="step-title">{t("register.step_identity")}</h2>
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
                  <label className="nomad-label">
                    {t("register.identity.biometric")}
                  </label>
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
                      <RefreshCw size={14} /> {t("reverify.retry")}
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
                          <Camera size={18} />{" "}
                          {t("reverify.use_pc").split(" ").slice(-1)}
                        </button>
                        <button
                          type="button"
                          className="method-btn"
                          onClick={() => setShowQR(true)}
                        >
                          <Smartphone size={18} />{" "}
                          {t("reverify.use_mobile").split(" ").slice(-1)}
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
                            {t("reverify.capture")}
                          </button>
                          <button
                            type="button"
                            className="btn-text-cancel"
                            onClick={stopCamera}
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    )}
                    {showQR && (
                      <div className="qr-view-container">
                        {isReceiving ? (
                          <div className="nomad-loader-box">
                            <div className="nomad-spinner"></div>
                            <span style={{ fontSize: "0.7rem" }}>
                              {t("register.identity.receiving")}
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
                          {t("common.back")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {faceMatchStatus === "success" && !isValidatingFace && (
                  <div className="nomad-ui-success animate-in">
                    <ShieldCheck size={14} />{" "}
                    <span>{t("register.identity.verified")}</span>
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
                    <ChevronLeft size={18} /> {t("common.back")}
                  </button>
                  {/* BLOQUEO: Solo se habilita si faceMatchStatus es success */}
                  <button
                    type="submit"
                    className="nomad-btn-primary"
                    disabled={isValidatingFace || faceMatchStatus !== "success"}
                  >
                    {isValidatingFace ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />{" "}
                        {t("register.identity.scanning")}
                      </>
                    ) : (
                      t("register.identity.finish")
                    )}
                  </button>
                </div>

                {faceMatchStatus !== "success" && !isValidatingFace && (
                  <button
                    type="button"
                    className="btn-text-cancel"
                    style={{ fontSize: "0.7rem", opacity: 0.8 }}
                    onClick={() =>
                      window.confirm(t("register.identity.later_confirm")) &&
                      handleSubmit(undefined, true)
                    }
                  >
                    {t("register.identity.later_btn")}
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
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {t("auth.login.no_account")}{" "}
          </span>
          <Link to="/login" className="link-to-register">
            {t("auth.login.submit")}
          </Link>
        </div>
      </div>

      {isTermsOpen && (
        <div className="modal-overlay blur terms-modal-overlay" onClick={() => setIsTermsOpen(false)}>
          <section className="terms-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{t("register.terms.title")}</h2>
              <button type="button" onClick={() => setIsTermsOpen(false)}>
                {t("common.cancel")}
              </button>
            </header>
            <div className="terms-modal-body">
              <p>{t("register.terms.intro")}</p>
              <h3>{t("register.terms.identity_title")}</h3>
              <p>{t("register.terms.identity_text")}</p>
              <h3>{t("register.terms.events_title")}</h3>
              <p>{t("register.terms.events_text")}</p>
              <h3>{t("register.terms.content_title")}</h3>
              <p>{t("register.terms.content_text")}</p>
              <h3>{t("register.terms.privacy_title")}</h3>
              <p>{t("register.terms.privacy_text")}</p>
            </div>
            <footer>
              <button
                type="button"
                className="nomad-btn-primary"
                onClick={() => {
                  setTermsAccepted(true);
                  setIsTermsOpen(false);
                }}
              >
                {t("register.terms.accept_action")}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default Register;
