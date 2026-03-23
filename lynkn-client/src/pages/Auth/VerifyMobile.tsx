import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

interface ServerResponse {
  status: "ok" | "error";
  message?: string;
}

const VerifyMobile: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<"idle" | "uploading" | "success">(
    "idle",
  );

  const SERVER_URL = "https://lynkn-backend.onrender.com";

  const socket: Socket = useMemo(
    () =>
      io(SERVER_URL, {
        transports: ["polling", "websocket"],
        withCredentials: true,
      }),
    [SERVER_URL],
  );

  useEffect(() => {
    if (sessionId) {
      socket.emit("join-session", sessionId);
    }
  }, [sessionId, socket]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStatus("uploading");
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);

          socket.emit(
            "send-selfie",
            {
              sessionId: sessionId,
              imageBase64: compressedBase64,
            },
            (response: ServerResponse) => {
              if (response?.status === "ok") {
                setStatus("success");
              } else {
                alert(response?.message || "Error de sincronización");
                setStatus("idle");
              }
            },
          );
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ letterSpacing: "0.3em", fontWeight: 900 }}>LYNKN</h1>
      <div
        style={{
          marginTop: "40px",
          border: "2px solid #1a1a1a",
          padding: "40px 20px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "350px",
          background: "#050505",
        }}
      >
        {status === "idle" && (
          <>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#71717a",
                marginBottom: "40px",
                lineHeight: "1.6",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Captura un selfie para verificar tu identidad y acceder al
              círculo.
            </p>
            <label
              style={{
                background: "#fff",
                color: "#000",
                padding: "20px",
                borderRadius: "4px",
                fontWeight: "900",
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "block",
                letterSpacing: "0.2em",
                textAlign: "center",
              }}
            >
              ABRIR CÁMARA
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleCapture}
                style={{ display: "none" }}
              />
            </label>
          </>
        )}
        {status === "uploading" && (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                letterSpacing: "0.2em",
                fontSize: "0.8rem",
                marginBottom: "10px",
              }}
            >
              SUBIENDO VERIFICACIÓN...
            </p>
            <div
              style={{
                margin: "20px auto",
                border: "2px solid #333",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          </div>
        )}
        {status === "success" && (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: "1rem",
                marginBottom: "10px",
              }}
            >
              ENVIADO
            </p>
            <p
              style={{
                color: "#71717a",
                fontSize: "0.75rem",
                lineHeight: "1.4",
              }}
            >
              Ya puedes cerrar esta ventana y continuar en tu ordenador.
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VerifyMobile;
