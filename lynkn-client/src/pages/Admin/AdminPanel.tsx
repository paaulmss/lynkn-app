import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig"; 
import "./AdminPanel.css";
import { AxiosError } from "axios";

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

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get("/admin/pending");
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
    try {
      await api.patch(`/admin/verify/${id}`, { status });
      
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      alert(`Usuario ${status === "approved" ? "Aprobado" : "Rechazado"} con éxito`);
    } catch (error) { 
      const err = error as AxiosError<{ message?: string }>;
      
      console.error("Error en verificación:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || "Error al actualizar estado. ¿Tu sesión ha expirado?";
      alert(errorMessage);
    }
  };

  if (loading) return <div className="admin-loading">Cargando solicitudes de acceso...</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>LYNKN AUTH-CHECK</h1>
        <p>Compara las fotos para validar la identidad del usuario</p>
      </header>

      <div className="admin-grid">
        {pendingUsers.length === 0 ? (
          <div className="empty-state">
             <p className="no-users">Bandeja de entrada vacía. No hay registros pendientes.</p>
          </div>
        ) : (
          pendingUsers.map((user) => (
            <div key={user.id} className="admin-card">
              <div className="comparison-view">
                <div className="photo-slot">
                  <span className="label">Foto Perfil</span>
                  <img src={user.foto_perfil} className="img-check" alt="Perfil" />
                </div>
                <div className="photo-slot">
                  <span className="label">Selfie QR (Móvil)</span>
                  <img
                    src={user.selfie_real_time}
                    className="img-check highlight"
                    alt="Selfie"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400?text=Error+Carga+Imagen"; }}
                  />
                </div>
              </div>

              <div className="user-details">
                <h3>{user.username}</h3>
                <p>{user.email}</p>
              </div>

              <div className="admin-actions">
                <button className="btn-approve" onClick={() => handleVerify(user.id, "approved")}>
                  APROBAR ACCESO
                </button>
                <button className="btn-reject" onClick={() => handleVerify(user.id, "rejected")}>
                  DENEGAR
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