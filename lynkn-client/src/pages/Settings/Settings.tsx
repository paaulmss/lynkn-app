import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Map as MapIcon,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Menu,
  AlertTriangle,
  Clock,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import ReverifyModal from "../Profile/ReverifyModal";
import DeleteAccountModal from "../Profile/DeleteAccountModal";
import LanguageModal from "./LanguageModal";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosConfig";
import "./Settings.css";

const Settings = () => {
  const {
    user,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    logout,
    updatePreferences,
  } = useAuth();

  const { t, i18n } = useTranslation();

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isReverifyOpen, setIsReverifyOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const isDarkMode = user?.theme !== "light";

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? "light" : "dark";
    await updatePreferences(newTheme, i18n.language as "es" | "en");
    toast.success(t("common.save"));
  };

  const handleReverifySuccess = () => {
    setIsReverifyOpen(false);
    toast.success(t("settings.verify_sent"));
  };

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);

    toast.promise(api.delete(`/users/${user?.id}`), {
      loading: t("settings.deleting_loader"),
      success: () => {
        setTimeout(() => {
          logout();
        }, 2500);
        return t("settings.delete_success");
      },
      error: (err) => {
        console.error("Error al borrar:", err);
        return t("settings.delete_error");
      },
    });
  };

  return (
    <div className={`explore-container ${!isDarkMode ? "light-mode" : ""}`}>
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
            <Menu color={isDarkMode ? "white" : "black"} size={24} />
          </button>
          <div className="navbar-page-title">{t("nav.settings")}</div>
        </header>

        <div className="settings-page-wrapper animate-in">
          <header className="settings-header">
            <h1>{t("settings.title")}</h1>
            <p>{t("settings.subtitle")}</p>
          </header>

          <div className="settings-grid">
            {/* SECCION: IDENTIDAD Y SEGURIDAD */}
            <section className="settings-card verification-status-card">
              <div className="card-header">
                <ShieldCheck size={20} color="var(--neon-glow)" />
                <span>{t("settings.sec_identity")}</span>
              </div>

              <div className={`status-container ${user?.status_verif}`}>
                <div className="status-main">
                  {user?.status_verif === "approved" && (
                    <div className="status-content">
                      <ShieldCheck size={32} color="#00f2ff" />
                      <div className="status-text">
                        <span className="status-title">
                          {t("settings.status_verified")}
                        </span>
                        <small>{t("settings.status_verified_desc")}</small>
                      </div>
                    </div>
                  )}

                  {user?.status_verif === "pending" && (
                    <div className="status-content">
                      <Clock size={32} color="#f59e0b" />
                      <div className="status-text">
                        <span className="status-title">
                          {t("settings.status_pending")}
                        </span>
                        <small>{t("settings.status_pending_desc")}</small>
                      </div>
                    </div>
                  )}

                  {user?.status_verif === "unverified" && (
                    <div className="status-content">
                      <AlertTriangle size={32} color="#ef4444" />
                      <div className="status-text">
                        <span className="status-title">
                          {t("settings.status_unverified")}
                        </span>
                        <small>{t("settings.status_unverified_desc")}</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECCION: APP & MAPA */}
            <section className="settings-card">
              <div className="card-header">
                <MapIcon size={20} color="var(--text-main)" />
                <span>{t("settings.sec_map")}</span>
              </div>

              <div className="settings-item">
                <div className="item-info">
                  <span>{t("settings.interface_mode")}</span>
                  <small>{t("settings.interface_desc")}</small>
                </div>
                <div
                  className={`theme-switch ${!isDarkMode ? "active" : ""}`}
                  onClick={toggleTheme}
                >
                  <div className="switch-handle">
                    {isDarkMode ? (
                      <Moon size={12} />
                    ) : (
                      <Sun size={12} color="#000" />
                    )}
                  </div>
                </div>
              </div>

              <div
                className="settings-item selectable"
                onClick={() => setIsLangModalOpen(true)}
              >
                <div className="item-with-icon">
                  <Globe size={20} color="var(--text-main)" />
                  <div className="item-info">
                    <span>{t("settings.interface_lang")}</span>
                    <small>
                      {i18n.language.startsWith("es")
                        ? "Español (España)"
                        : "English (US)"}
                    </small>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </section>

            {/* SECCION: ZONA DE PELIGRO */}
            <section className="settings-card danger-zone-card">
              <div className="card-header danger">
                <Trash2 size={20} />
                <span>{t("settings.sec_danger")}</span>
              </div>

              <div className="settings-item danger-item">
                <div className="item-info">
                  <span className="danger-title">
                    {t("settings.delete_acc")}
                  </span>
                  <p className="danger-description">
                    {t("settings.delete_acc_desc")}
                  </p>
                </div>
                <button
                  className="delete-acc-btn"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  {t("common.delete")}
                </button>
              </div>
            </section>

            <button className="logout-full-btn" onClick={logout}>
              <LogOut size={20} />
              {t("settings.logout")}
            </button>
          </div>
        </div>
      </main>

      {/* MODALES */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />

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

      {isDeleteModalOpen && (
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
          username={user?.username || ""}
        />
      )}
    </div>
  );
};

export default Settings;
