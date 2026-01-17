// Top navigation bar.
﻿import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import "./Navbar.css";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        IPVC Lost + Found
      </Link>
      <div className="nav-links">
        <Link to="/">Inicio</Link>
        <Link to="/create">Publicar</Link>
        {isAuthenticated ? (
          <>
            <Link to="/chat" className="nav-link-with-badge">
              <span>Chat</span>
              {unreadCount > 0 && <span className="nav-badge">{displayCount}</span>}
            </Link>
            <Link to="/profile">Perfil</Link>
            <span className="user-chip">{user?.name || user?.email}</span>
            <button className="ghost-btn" type="button" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Entrar</Link>
            <Link to="/register" className="primary-btn">
              Registar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
