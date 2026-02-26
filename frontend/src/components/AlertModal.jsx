export default function AlertModal({ title, message, type, onClose }) {
  const iconStyles = {
    error: { background: "#ffebee", icon: "\u26A0" },
    warning: { background: "#fff8e1", icon: "\u26A0" },
    success: { background: "#e8f5e9", icon: "\u2714" },
  };
  const style = iconStyles[type] || iconStyles.success;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: style.background,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              fontSize: "1.4rem",
            }}
          >
            {style.icon}
          </div>
          <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
