import { useState } from "react";

export default function ConfirmModal({ title, message, confirmLabel, confirmStyle, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: confirmStyle === "danger" ? "#ffebee" : "#fff3e0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              fontSize: "1.4rem",
            }}
          >
            {confirmStyle === "danger" ? "\u26A0" : "\u2139"}
          </div>
          <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${confirmStyle === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
