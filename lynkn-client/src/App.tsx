import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider"; 

import Home from "./pages/Home/Home";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Profile/Profile";
import AdminPanel from "./pages/Admin/AdminPanel";
import VerifyMobile from "./pages/Auth/VerifyMobile";
import ProtectedRoute from "./components/ProtectedRoute";
import Explore from "./pages/Explorer/Explore";
import NotificationsPage from "./components/notifcations/NotificationsPage"; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* --- VISTAS PÚBLICAS --- */}
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

          {/* --- RUTAS DE ADMINISTRACIÓN ---*/}
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;