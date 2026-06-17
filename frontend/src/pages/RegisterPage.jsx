import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelect from "../components/LanguageSelect";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("passwordMinError"));
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "var(--sp-12) auto" }}>
      <div className="card card-elevated fade-in" style={{ padding: "var(--sp-10) var(--sp-8) var(--sp-8)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--sp-5)" }}>
          <LanguageSelect />
        </div>
        <div style={{ textAlign: "center", marginBottom: "var(--sp-8)" }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "var(--sp-1)" }}>{t("createAccount")}</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            {t("registerSubtitle")}
          </p>
        </div>

        {error && <div className="inline-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("fullName")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t("yourName")} />
          </div>
          <div className="form-group">
            <label>{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>{t("password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t("minimumCharacters")} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
            {loading ? t("creatingAccount") : t("register")}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "var(--sp-5)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          {t("alreadyHaveAccount")} <Link to="/login">{t("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
