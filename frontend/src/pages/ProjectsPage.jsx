import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function BudgetComparisonChart({ projects }) {
  const data = useMemo(() => {
    const pestaAdat = { planned: 0, spent: 0, count: 0 };
    const threeM = { planned: 0, spent: 0, count: 0 };

    for (const p of projects) {
      const target = p.eventType === "PESTA_ADAT" ? pestaAdat : threeM;
      target.count++;
      for (const evt of p.events || []) {
        for (const c of evt.categories || []) {
          target.planned += Number(c.plannedBudget);
          target.spent += Number(c.actualCost);
        }
      }
    }

    return { pestaAdat, threeM };
  }, [projects]);

  const hasPestaAdat = data.pestaAdat.count > 0;
  const hasThreeM = data.threeM.count > 0;

  if (!hasPestaAdat && !hasThreeM) return null;

  const chartData = [];
  if (hasPestaAdat) {
    chartData.push({ name: "Pesta Adat", Planned: data.pestaAdat.planned, Spent: data.pestaAdat.spent });
  }
  if (hasThreeM) {
    chartData.push({ name: "3M Ceremony", Planned: data.threeM.planned, Spent: data.threeM.spent });
  }

  const pestaAdatDiff = data.pestaAdat.planned - data.pestaAdat.spent;
  const threeMDiff = data.threeM.planned - data.threeM.spent;

  return (
    <div className="card" style={{ marginBottom: "1.5rem", padding: "1.2rem" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Budget Overview: Pesta Adat vs 3M</h3>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: hasPestaAdat && hasThreeM ? "1fr 1fr" : "1fr", gap: "0.75rem", marginBottom: "1.2rem" }}>
        {hasPestaAdat && (
          <div style={{ background: "#f1f8e9", borderRadius: "var(--radius)", padding: "0.8rem", border: "1px solid #c5e1a5" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
              Pesta Adat ({data.pestaAdat.count} project{data.pestaAdat.count > 1 ? "s" : ""})
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Planned</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{formatRupiah(data.pestaAdat.planned)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Spent</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{formatRupiah(data.pestaAdat.spent)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Diff</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: pestaAdatDiff >= 0 ? "var(--primary)" : "var(--danger)" }}>
                  {pestaAdatDiff >= 0 ? "+" : ""}{formatRupiah(pestaAdatDiff)}
                </div>
              </div>
            </div>
          </div>
        )}
        {hasThreeM && (
          <div style={{ background: "#e8f5e9", borderRadius: "var(--radius)", padding: "0.8rem", border: "1px solid #a5d6a7" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
              3M Ceremony ({data.threeM.count} project{data.threeM.count > 1 ? "s" : ""})
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Planned</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{formatRupiah(data.threeM.planned)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Spent</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{formatRupiah(data.threeM.spent)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Diff</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: threeMDiff >= 0 ? "var(--primary)" : "var(--danger)" }}>
                  {threeMDiff >= 0 ? "+" : ""}{formatRupiah(threeMDiff)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barCategoryGap="25%">
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatRupiah(v)} />
          <Legend />
          <Bar dataKey="Planned" fill="#81c784" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.Spent > entry.Planned ? "#c62828" : "#2e7d32"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stacked percentage comparison */}
      {hasPestaAdat && hasThreeM && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Spending Progress</div>
          {[
            { label: "Pesta Adat", planned: data.pestaAdat.planned, spent: data.pestaAdat.spent },
            { label: "3M Ceremony", planned: data.threeM.planned, spent: data.threeM.spent },
          ].map((item) => {
            const pct = item.planned > 0 ? (item.spent / item.planned) * 100 : 0;
            return (
              <div key={item.label} style={{ marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.15rem" }}>
                  <span>{item.label}</span>
                  <span style={{ color: pct > 100 ? "var(--danger)" : "var(--text-secondary)" }}>{pct.toFixed(1)}% of planned</span>
                </div>
                <div className="progress-bar" style={{ height: "8px" }}>
                  <div
                    className="fill"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: pct > 100 ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listProjects()
      .then((data) => setProjects(data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading projects...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>My Wedding Projects</h1>
        <button className="btn btn-primary" onClick={() => navigate("/projects/new")}>
          + New Project
        </button>
      </div>

      {/* Budget Comparison Chart */}
      {projects.length > 0 && <BudgetComparisonChart projects={projects} />}

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>No wedding projects yet.</p>
          <Link to="/projects/new" className="btn btn-primary">Create Your First Project</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {projects.map((p) => {
            const totalActual = (p.events || []).flatMap((e) => e.categories || []).reduce((s, c) => s + Number(c.actualCost), 0);
            const pct = Number(p.totalBudget) > 0 ? (totalActual / Number(p.totalBudget)) * 100 : 0;

            return (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ transition: "box-shadow 0.2s", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>
                        {p.groomName} & {p.brideName}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {new Date(p.weddingDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                        {" "}&bull;{" "}
                        {p.eventType === "THREE_M" ? "3M Ceremony" : "Pesta Adat"}
                      </p>
                    </div>
                    <span className={`badge ${p.isFinalized ? "badge-success" : "badge-warning"}`}>
                      {p.isFinalized ? "Finalized" : "In Progress"}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                      <span>Budget: {formatRupiah(p.totalBudget)}</span>
                      <span>{pct.toFixed(1)}% used</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: pct > 100 ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
