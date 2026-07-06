import { useLanguage } from "../i18n/LanguageContext";

export default function LanguageSelect({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label
      className={`language-select${compact ? " language-select-compact" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        color: "var(--text-secondary)",
        fontSize: "0.8125rem",
      }}
    >
      <span>{t("language")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label={t("language")}
        style={{
          height: compact ? 36 : 36,
          minWidth: compact ? 76 : 150,
          borderRadius: "var(--radius-pill)",
          border: compact ? "1px solid var(--border)" : "1px solid var(--border)",
          background: compact ? "var(--canvas)" : "var(--surface)",
          color: "var(--text)",
          padding: "0 var(--sp-2)",
          fontSize: "0.8125rem",
        }}
      >
        <option value="en" style={{ color: "var(--text)" }}>{compact ? "EN" : t("english")}</option>
        <option value="id" style={{ color: "var(--text)" }}>{compact ? "ID" : t("indonesian")}</option>
      </select>
    </label>
  );
}
