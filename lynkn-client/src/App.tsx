import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { Toaster } from "sonner";

const Home = lazy(() => import('./pages/Home/Home'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
const VerifyMobile = lazy(() => import('./pages/Auth/VerifyMobile'));
import ProtectedRoute from "./components/ProtectedRoute";
const Explore = lazy(() => import('./pages/Explorer/Explore'));
const NotificationsPage = lazy(() => import('./components/notifcations/NotificationsPage'));
const MessagesPage = lazy(() => import('./pages/Messages/MessagesPage'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const MyRequestsPage = lazy(() => import('./pages/Requests/MyRequestsPage'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
        <Suspense fallback={<div role="status">Cargando...</div>}>
        <Routes>
          {/* --- VISTAS PUBLICAS --- */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:sessionId" element={<VerifyMobile />} />

          {/* --- RUTAS PROTEGIDAS (Requieren Login) --- */}

          {/* Perfil de usuario */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:profileId"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Explore/Mapa */}
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />

          {/* Centro de Notificaciones*/}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* MENSAJES / CHAT */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          {/* MIS SOLICITUDES */}
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* AJUSTES */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* --- RUTAS DE ADMINISTRACION ---*/}
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
