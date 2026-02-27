import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import AlertModal from "./AlertModal";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [alertModal, setAlertModal] = useState(null);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  function openChangePassword() {
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwError("");
    setShowPw({ current: false, new: false, confirm: false });
    setShowPasswordModal(true);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    setPwSaving(true);
    try {
      await api.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setShowPasswordModal(false);
      setAlertModal({
        title: "Password Changed",
        message: "Your password has been changed successfully.",
        type: "success",
      });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
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
              <>
                <Link to="/admin/vendors" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
                  Admin Vendors
                </Link>
                <Link to="/admin/master-categories" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
                  Admin Categories
                </Link>
                <Link to="/admin/users" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
                  Admin Users
                </Link>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem" }}>
            <span style={{ opacity: 0.85 }}>{user?.name}</span>
            <button
              onClick={openChangePassword}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "none",
                padding: "0.35rem 0.8rem",
                borderRadius: "var(--radius)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Change Password
            </button>
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Change Password</h3>
            {pwError && (
              <div style={{ background: "#ffebee", color: "var(--danger)", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.8rem", fontSize: "0.85rem" }}>
                {pwError}
              </div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.current ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    required
                    placeholder="Enter current password"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--text-secondary)" }}
                    tabIndex={-1}
                  >
                    {showPw.current ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.new ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, new: !s.new }))}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--text-secondary)" }}
                    tabIndex={-1}
                  >
                    {showPw.new ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.confirm ? "text" : "password"}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--text-secondary)" }}
                    tabIndex={-1}
                  >
                    {showPw.confirm ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                  {pwSaving ? "Saving..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <AlertModal
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onClose={() => setAlertModal(null)}
        />
      )}
    </>
  );
}
