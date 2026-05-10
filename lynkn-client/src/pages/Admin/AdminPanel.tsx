import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import "./AdminPanel.css";
import { AxiosError } from "axios";
import { MessageSquare, Check, X, AlertCircle } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  foto_perfil: string;
  selfie_real_time: string;
  status_verif: string;
}

const AdminPanel: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para las notas personalizadas por usuario
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({});

  // Configuracion de respuestas rapidas
  const QUICK_RESPONSES = [
    "La foto de perfil no es una cara clara.",
    "La selfie no coincide con la foto de perfil.",
    "Imagen demasiado borrosa o con poca luz.",
    "Por favor, sube un primer plano de tu rostro.",
    "Contenido inapropiado detectado.",
  ];

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem("lykn_token");
        const res = await api.get("/auth/admin/pending", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPendingUsers(res.data);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleVerify = async (id: number, status: "approved" | "rejected") => {
    const message = adminNotes[id] || "";

    if (status === "rejected" && !message) {
      if (!window.confirm("¿Deseas rechazar sin enviar un motivo al usuario?"))
        return;
    }

    try {
      await api.patch(`/auth/admin/verify/${id}`, { status, message });

      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      const newNotes = { ...adminNotes };
      delete newNotes[id];
      setAdminNotes(newNotes);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage =
        err.response?.data?.message || "Error al actualizar estado.";
      alert(errorMessage);
    }
  };

  const setQuickNote = (userId: number, note: string) => {
    setAdminNotes((prev) => ({ ...prev, [userId]: note }));
  };

  if (loading)
    return (
      <div className="admin-loading">Cargando protocolos de seguridad...</div>
    );

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>
          LYNKN <span className="highlight-text">AUTH-CHECK</span>
        </h1>
        <p>Verificación de identidad biométrica manual</p>
      </header>

      <div className="admin-grid">
        {pendingUsers.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} color="#3f3f46" />
            <p className="no-users">
              Protocolos al día. No hay registros pendientes de validación.
            </p>
          </div>
        ) : (
          pendingUsers.map((user) => (
            <div key={user.id} className="admin-card">
              <div className="comparison-view">
                <div className="photo-slot">
                  <span className="label">ORIGINAL (PERFIL)</span>
                  <img
                    src={user.foto_perfil}
                    className="img-check"
                    alt="Perfil"
                  />
                </div>
                <div className="photo-slot">
                  <span className="label">CAPTURA (REAL-TIME)</span>
                  <img
                    src={user.selfie_real_time}
                    className={`img-check highlight ${!user.selfie_real_time ? "error" : ""}`}
                    alt="Selfie"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x400?text=Error+Carga+Imagen";
                    }}
                  />
                </div>
              </div>

              <div className="user-details">
                <h3>@{user.username}</h3>
                <p>{user.email}</p>
              </div>

              <div className="admin-feedback-section">
                <div className="quick-responses">
                  {QUICK_RESPONSES.map((resp, idx) => (
                    <button
                      key={idx}
                      className="quick-btn"
                      onClick={() => setQuickNote(user.id, resp)}
                    >
                      {resp}
                    </button>
                  ))}
                </div>

                <div className="custom-note-area">
                  <MessageSquare size={14} className="note-icon" />
                  <textarea
                    placeholder="Escribe un motivo personalizado o selecciona uno arriba..."
                    value={adminNotes[user.id] || ""}
                    onChange={(e) => setQuickNote(user.id, e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleVerify(user.id, "approved")}
                >
                  <Check size={18} /> APROBAR
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleVerify(user.id, "rejected")}
                >
                  <X size={18} /> DENEGAR
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
