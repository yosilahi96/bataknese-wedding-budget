import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        background: "var(--primary-dark)",
        color: "white",
        padding: "0.8rem 1rem",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link to="/" style={{ color: "white", fontWeight: 700, fontSize: "1.05rem" }}>
            Batak Wedding Budget
          </Link>
          <Link to="/vendors" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
            Vendors
          </Link>
          {user?.isAdmin && (
            <Link to="/admin/vendors" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
              Admin
            </Link>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.9rem" }}>
          <span style={{ opacity: 0.85 }}>{user?.name}</span>
          <button
            onClick={logout}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "none",
              padding: "0.35rem 0.8rem",
              borderRadius: "var(--radius)",
              fontSize: "0.85rem",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
