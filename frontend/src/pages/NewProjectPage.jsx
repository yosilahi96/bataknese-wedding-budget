import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import RupiahInput from "../components/RupiahInput";
import { getTomorrowDateInputValue, isFutureDateInput } from "../utils/dateInput";

const JAKARTA_AREAS = [
  "Jakarta Pusat",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Selatan",
  "Jakarta Timur",
  "Tangerang",
  "Tangerang Selatan",
  "Bekasi",
  "Depok",
  "Bogor",
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const minWeddingDate = getTomorrowDateInputValue();
  const [form, setForm] = useState({
    groomName: "",
    brideName: "",
    groomDomicile: "",
    brideDomicile: "",
    weddingDate: "",
    totalBudget: "",
    guestCount: "",
    eventType: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isFutureDateInput(form.weddingDate)) {
      setError(t("futureWeddingDateRequired"));
      return;
    }
    setLoading(true);
    try {
      const data = await api.createProject({
        ...form,
        totalBudget: Number(form.totalBudget),
        guestCount: form.guestCount ? Number(form.guestCount) : null,
      });
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: "0 auto" }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate("/")}
        style={{ marginBottom: "var(--sp-4)", gap: "var(--sp-1)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t("backToProjects")}
      </button>

      <h1 className="page-title" style={{ marginBottom: "var(--sp-2)" }}>{t("newWeddingProject")}</h1>
      <p className="page-subtitle" style={{ marginBottom: "var(--sp-8)" }}>{t("newWeddingProjectSubtitle")}</p>

      <div className="card">
        {error && <div className="inline-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Section: Couple Information */}
          <div className="form-section">
            <div className="form-section-title">{t("coupleInformation")}</div>
            <div className="grid-2">
              <div className="form-group">
                <label>{t("groomName")}</label>
                <input type="text" value={form.groomName} onChange={(e) => update("groomName", e.target.value)} required placeholder="e.g. Parlindungan Sihotang" />
              </div>
              <div className="form-group">
                <label>{t("brideName")}</label>
                <input type="text" value={form.brideName} onChange={(e) => update("brideName", e.target.value)} required placeholder="e.g. Rina Simbolon" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>{t("groomDomicile")}</label>
                <select value={form.groomDomicile} onChange={(e) => update("groomDomicile", e.target.value)} required>
                  <option value="">{t("selectArea")}</option>
                  {JAKARTA_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t("brideDomicile")}</label>
                <input type="text" value={form.brideDomicile} onChange={(e) => update("brideDomicile", e.target.value)} required placeholder="e.g. Jakarta Timur or Medan" />
              </div>
            </div>
          </div>

          {/* Section: Event Details */}
          <div className="form-section">
            <div className="form-section-title">{t("eventDetails")}</div>
            <div className="grid-2">
              <div className="form-group">
                <label>{t("weddingDate")}</label>
                <input type="date" value={form.weddingDate} onChange={(e) => update("weddingDate", e.target.value)} required min={minWeddingDate} />
              </div>
              <div className="form-group">
                <label>{t("totalBudgetRp")}</label>
                <RupiahInput value={form.totalBudget} onChange={(v) => update("totalBudget", v)} required placeholder="e.g. 150.000.000" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>{t("guestCount")}</label>
                <input type="number" value={form.guestCount} onChange={(e) => update("guestCount", e.target.value)} placeholder="e.g. 500" min="1" />
              </div>
              <div />
            </div>
          </div>

          {/* Section: Event Type */}
          <div className="form-section">
            <div className="form-section-title">{t("eventType")}</div>
            <div style={{ display: "flex", gap: "var(--sp-3)" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  cursor: "pointer",
                  padding: "var(--sp-4)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${form.eventType === "PESTA_ADAT" ? "var(--primary)" : "var(--border)"}`,
                  background: form.eventType === "PESTA_ADAT" ? "var(--primary-light)" : "var(--surface)",
                  flex: 1,
                  transition: "all var(--transition-fast)",
                }}
              >
                <input
                  type="radio"
                  name="eventType"
                  value="PESTA_ADAT"
                  checked={form.eventType === "PESTA_ADAT"}
                  onChange={(e) => update("eventType", e.target.value)}
                  required
                  style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Pesta Adat</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{t("traditionalCeremony")}</div>
                </div>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  cursor: "pointer",
                  padding: "var(--sp-4)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${form.eventType === "THREE_M" ? "var(--primary)" : "var(--border)"}`,
                  background: form.eventType === "THREE_M" ? "var(--primary-light)" : "var(--surface)",
                  flex: 1,
                  transition: "all var(--transition-fast)",
                }}
              >
                <input
                  type="radio"
                  name="eventType"
                  value="THREE_M"
                  checked={form.eventType === "THREE_M"}
                  onChange={(e) => update("eventType", e.target.value)}
                  required
                  style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{t("ceremony3M")}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{t("modernFormat")}</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end", paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border-light)" }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? t("creating") : t("createProject")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
