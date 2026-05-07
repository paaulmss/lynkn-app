import { useState } from "react";
import { 
  Globe, 
  Map as MapIcon, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  Menu, 
} from "lucide-react";
import Sidebar from "../../components/Sidebar"; 
import CreatePostModal from "../../components/posts/CreatePostModal"; 
import { useAuth } from "../../hooks/useAuth";
import "./Settings.css";

const Settings = () => {
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="ajustes"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        
        {/* BARRA SUPERIOR */}
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

        {/* CUERPO DE AJUSTES */}
        <div className="settings-page-wrapper">
          <header className="settings-header">
            <h1>AJUSTES</h1>
            <p>Gestiona tu experiencia en Lynkn</p>
          </header>

          <div className="settings-grid">
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

            {/* SECCION: SEGURIDAD */}
            <section className="settings-card">
              <div className="card-header">
                <ShieldCheck size={20} />
                <span>SEGURIDAD</span>
              </div>
              <div className="settings-item">
                <span>Verificacion de cuenta</span>
                <span className="badge-verified">ACTIVA</span>
              </div>
            </section>

            {/* BOTON CERRAR SESION */}
            <button className="logout-full-btn">
              <LogOut size={20} />
              CERRAR SESION
            </button>
          </div>
        </div>
      </main>

      {/* MODAL DE CREACION DE POST */}
      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={() => setIsCreatePostOpen(false)}
        />
      )}
    </div>
  );
};

export default Settings;