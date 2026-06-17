import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { api } from "../api/client";
import AlertModal from "./AlertModal";
import LanguageSelect from "./LanguageSelect";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
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
      setPwError(t("passwordMismatch"));
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
        title: t("passwordChanged"),
        message: t("passwordChangedMessage"),
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
      <nav className="navbar">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <Link to="/" className="navbar-brand">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                BatakWedding
              </span>
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)", marginLeft: "var(--sp-4)" }}>
              <Link to="/vendors" className="navbar-link">{t("navVendors")}</Link>
              {user?.isAdmin && (
                <>
                  <Link to="/admin/vendors" className="navbar-link">{t("navAdminVendors")}</Link>
                  <Link to="/admin/vendor-types" className="navbar-link">{t("navVendorTypes")}</Link>
                  <Link to="/admin/master-categories" className="navbar-link">{t("navCategories")}</Link>
                  <Link to="/admin/users" className="navbar-link">{t("navUsers")}</Link>
                </>
              )}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <LanguageSelect compact />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem" }}>{user?.name}</span>
            <button onClick={openChangePassword} className="navbar-btn">{t("navPassword")}</button>
            <button onClick={logout} className="navbar-btn">{t("navLogout")}</button>
          </div>
        </div>
      </nav>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>{t("changePassword")}</h3>
            {pwError && <div className="inline-error">{pwError}</div>}
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>{t("currentPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.current ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    required
                    placeholder={t("enterCurrentPassword")}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-secondary)" }}
                    tabIndex={-1}
                  >
                    {showPw.current ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{t("newPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.new ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required
                    minLength={6}
                    placeholder={t("minimumCharacters")}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, new: !s.new }))}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-secondary)" }}
                    tabIndex={-1}
                  >
                    {showPw.new ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{t("confirmNewPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.confirm ? "text" : "password"}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    placeholder={t("reenterNewPassword")}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-secondary)" }}
                    tabIndex={-1}
                  >
                    {showPw.confirm ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                  {pwSaving ? t("saving") : t("changePassword")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
