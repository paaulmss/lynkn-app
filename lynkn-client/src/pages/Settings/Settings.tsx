import { useState } from "react";
import { 
  Globe, 
  Map as MapIcon, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  Menu,
  AlertTriangle,
  Clock
} from "lucide-react";
import Sidebar from "../../components/Sidebar"; 
import CreatePostModal from "../../components/posts/CreatePostModal";
import ReverifyModal from "../Profile/ReverifyModal"; 
import { useAuth } from "../../hooks/useAuth";
import "./Settings.css";

const Settings = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar, logout } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isReverifyOpen, setIsReverifyOpen] = useState(false);

  const handleReverifySuccess = () => {
    setIsReverifyOpen(false);
    console.log("Proceso de re-verificación enviado");
  };

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="ajustes"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button
            className="icon-btn menu-trigger"
            onClick={toggleSidebar}
            type="button"
          >
            <Menu color="white" size={24} />
          </button>
          <div className="navbar-page-title">AJUSTES</div>
        </header>

        <div className="settings-page-wrapper">
          <header className="settings-header">
            <h1>AJUSTES</h1>
            <p>Gestiona tu experiencia en Lynkn</p>
          </header>

          <div className="settings-grid">
            
            {/* SECCION: IDENTIDAD Y SEGURIDAD */}
            <section className="settings-card verification-status-card">
              <div className="card-header">
                <ShieldCheck size={20} />
                <span>IDENTIDAD Y SEGURIDAD</span>
              </div>
              
              <div className={`status-container ${user?.status_verif}`}>
                <div className="status-main">
                  {/* CASO: APROBADO */}
                  {user?.status_verif === 'approved' && (
                    <div className="status-content">
                      <ShieldCheck size={32} color="#00f2ff" />
                      <div className="status-text">
                        <span className="status-title">CUENTA VERIFICADA</span>
                        <small>Tu identidad ha sido confirmada con éxito.</small>
                      </div>
                    </div>
                  )}

                  {/* CASO: PENDIENTE */}
                  {user?.status_verif === 'pending' && (
                    <div className="status-content">
                      <Clock size={32} color="#f59e0b" />
                      <div className="status-text">
                        <span className="status-title">VERIFICACIÓN PENDIENTE</span>
                        <small>Estamos revisando tu selfie. Esto tardará poco.</small>
                      </div>
                    </div>
                  )}

                  {/* CASO: NO VERIFICADO */}
                  {user?.status_verif === 'unverified' && (
                    <div className="status-content">
                      <AlertTriangle size={32} color="#ef4444" />
                      <div className="status-text">
                        <span className="status-title">IDENTIDAD NO VERIFICADA</span>
                        <small>Acceso limitado. No puedes unirte a eventos.</small>
                      </div>
                    </div>
                  )}

                  {/* CASO: RECHAZADO */}
                  {user?.status_verif === 'rejected' && (
                    <div className="status-content rejected-layout">
                      <div className="status-info-group">
                        <AlertTriangle size={32} color="#ef4444" />
                        <div className="status-text">
                          <span className="status-title" style={{ color: "#ef4444" }}>VERIFICACIÓN RECHAZADA</span>
                          <small>Tu solicitud no cumple los requisitos de seguridad.</small>
                        </div>
                      </div>
                      
                      {/* Nota del administrador si existe */}
                      {user?.verif_message && (
                        <div className="admin-note-settings">
                          <span className="note-label">NOTA DEL ADMINISTRADOR:</span>
                          <p>"{user.verif_message}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BOTON DE ACCION*/}
                {(user?.status_verif === 'unverified' || user?.status_verif === 'rejected') && (
                  <button 
                    className="verify-action-btn"
                    onClick={() => setIsReverifyOpen(true)}
                  >
                    {user?.status_verif === 'rejected' ? 'REINTENTAR VERIFICACIÓN' : 'VERIFICAR AHORA'}
                  </button>
                )}
              </div>
            </section>

            {/* SECCION: APP & MAPA */}
            <section className="settings-card">
              <div className="card-header">
                <MapIcon size={20} />
                <span>MAPA Y NAVEGACION</span>
              </div>
              <div className="settings-item">
                <div className="item-info">
                  <span>Estilo del mapa</span>
                  <small>Cambia la apariencia visual</small>
                </div>
                <select className="settings-select">
                  <option>Alidade Smooth Dark</option>
                  <option>Satellite View</option>
                  <option>Streets</option>
                </select>
              </div>
              <div className="settings-item">
                <div className="item-info">
                  <span>Radio de busqueda</span>
                  <small>Distancia maxima permitida</small>
                </div>
                <input type="range" min="1" max="50" className="settings-range" />
              </div>
            </section>

            {/* SECCION: IDIOMA */}
            <section className="settings-card">
              <div className="card-header">
                <Globe size={20} />
                <span>IDIOMA</span>
              </div>
              <div className="settings-item selectable">
                <div className="item-info">
                  <span>Idioma de la interfaz</span>
                  <small>Español (España)</small>
                </div>
                <ChevronRight size={18} />
              </div>
            </section>

            {/* BOTON CERRAR SESION */}
            <button className="logout-full-btn" onClick={logout}>
              <LogOut size={20} />
              CERRAR SESION
            </button>
          </div>
        </div>
      </main>


      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={() => setIsCreatePostOpen(false)}
        />
      )}

      {isReverifyOpen && (
        <ReverifyModal 
          onClose={() => setIsReverifyOpen(false)} 
          onUpload={handleReverifySuccess} 
        />
      )}
    </div>
  );
};

export default Settings;