import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
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
