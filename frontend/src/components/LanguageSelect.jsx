import { useLanguage } from "../i18n/LanguageContext";

export default function LanguageSelect({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        color: compact ? "rgba(255,255,255,0.75)" : "var(--text-secondary)",
        fontSize: "0.8125rem",
      }}
    >
      <span>{t("language")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label={t("language")}
        style={{
          height: 32,
          minWidth: compact ? 92 : 150,
          borderRadius: "var(--radius)",
          border: compact ? "1px solid rgba(255,255,255,0.22)" : "1px solid var(--border)",
          background: compact ? "rgba(255,255,255,0.08)" : "var(--surface)",
          color: compact ? "white" : "var(--text)",
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
