import { useState } from "react";
import { createPortal } from "react-dom";

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

  const isDanger = confirmStyle === "danger";

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ textAlign: "center", padding: "var(--sp-2) 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: isDanger ? "#fef2f2" : "#fff7ed",
              color: isDanger ? "var(--danger)" : "var(--warning)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--sp-5)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 style={{ marginBottom: "var(--sp-2)", fontSize: "1.0625rem" }}>{title}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
