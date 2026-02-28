import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RupiahInput from "../components/RupiahInput";

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
        Back to Projects
      </button>

      <h1 className="page-title" style={{ marginBottom: "var(--sp-2)" }}>New Wedding Project</h1>
      <p className="page-subtitle" style={{ marginBottom: "var(--sp-8)" }}>Fill in the details to create your wedding budget tracker.</p>

      <div className="card">
        {error && <div className="inline-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Section: Couple Information */}
          <div className="form-section">
            <div className="form-section-title">Couple Information</div>
            <div className="grid-2">
              <div className="form-group">
                <label>Groom Name</label>
                <input type="text" value={form.groomName} onChange={(e) => update("groomName", e.target.value)} required placeholder="e.g. Parlindungan Sihotang" />
              </div>
              <div className="form-group">
                <label>Bride Name</label>
                <input type="text" value={form.brideName} onChange={(e) => update("brideName", e.target.value)} required placeholder="e.g. Rina Simbolon" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Groom Domicile (Jakarta Area)</label>
                <select value={form.groomDomicile} onChange={(e) => update("groomDomicile", e.target.value)} required>
                  <option value="">Select area</option>
                  {JAKARTA_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Bride Domicile</label>
                <input type="text" value={form.brideDomicile} onChange={(e) => update("brideDomicile", e.target.value)} required placeholder="e.g. Jakarta Timur or Medan" />
              </div>
            </div>
          </div>

          {/* Section: Event Details */}
          <div className="form-section">
            <div className="form-section-title">Event Details</div>
            <div className="grid-2">
              <div className="form-group">
                <label>Wedding Date</label>
                <input type="date" value={form.weddingDate} onChange={(e) => update("weddingDate", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Total Budget (Rp)</label>
                <RupiahInput value={form.totalBudget} onChange={(v) => update("totalBudget", v)} required placeholder="e.g. 150.000.000" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Guest Count (optional)</label>
                <input type="number" value={form.guestCount} onChange={(e) => update("guestCount", e.target.value)} placeholder="e.g. 500" min="1" />
              </div>
              <div />
            </div>
          </div>

          {/* Section: Event Type */}
          <div className="form-section">
            <div className="form-section-title">Event Type</div>
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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Traditional ceremony</div>
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
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>3M Ceremony</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Modern format</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end", paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border-light)" }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
