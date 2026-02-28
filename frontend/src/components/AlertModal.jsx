export default function AlertModal({ title, message, type, onClose }) {
  const iconStyles = {
    error: { background: "#fef2f2", color: "var(--danger)" },
    warning: { background: "#fff7ed", color: "var(--warning)" },
    success: { background: "#dcfce7", color: "var(--success)" },
  };
  const style = iconStyles[type] || iconStyles.success;

  const icons = {
    error: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    success: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ textAlign: "center", padding: "var(--sp-2) 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: style.background,
              color: style.color,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--sp-5)",
            }}
          >
            {icons[type] || icons.success}
          </div>
          <h3 style={{ marginBottom: "var(--sp-2)", fontSize: "1.0625rem" }}>{title}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
