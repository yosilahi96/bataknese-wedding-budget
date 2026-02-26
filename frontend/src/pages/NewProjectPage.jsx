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
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>New Wedding Project</h1>

      <div className="card">
        {error && (
          <div style={{ background: "#ffebee", color: "var(--danger)", padding: "0.6rem 0.8rem", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.88rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label>Event Type</label>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="radio" name="eventType" value="PESTA_ADAT" checked={form.eventType === "PESTA_ADAT"} onChange={(e) => update("eventType", e.target.value)} required />
                Pesta Adat
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="radio" name="eventType" value="THREE_M" checked={form.eventType === "THREE_M"} onChange={(e) => update("eventType", e.target.value)} required />
                3M Ceremony
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
