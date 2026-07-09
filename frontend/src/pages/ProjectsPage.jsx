import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

const chartTooltipStyle = {
  borderRadius: "20px",
  border: "1px solid var(--border)",
  boxShadow: "var(--shadow-md)",
  fontSize: "0.8125rem",
  background: "rgba(252, 251, 250, 0.96)",
  color: "var(--text)",
};

const PROJECTS_PER_PAGE = 5;

function getPageNumbers(currentPage, totalPages) {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function BudgetComparisonChart({ projects }) {
  const { t } = useLanguage();
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
    chartData.push({ name: "Pesta Adat", [t("planned")]: data.pestaAdat.planned, [t("spent")]: data.pestaAdat.spent });
  }
  if (hasThreeM) {
    chartData.push({ name: t("ceremony3M"), [t("planned")]: data.threeM.planned, [t("spent")]: data.threeM.spent });
  }

  const pestaAdatDiff = data.pestaAdat.planned - data.pestaAdat.spent;
  const threeMDiff = data.threeM.planned - data.threeM.spent;

  const totalBudget = data.pestaAdat.planned + data.threeM.planned;

  return (
    <div className="card fade-in" style={{ marginBottom: "var(--sp-8)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-6)" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{t("budgetOverview")}</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>{t("budgetComparison")}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{t("totalBudget")}</div>
          <div className="currency-lg" style={{ color: "var(--text)" }}>{formatRupiah(totalBudget)}</div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="responsive-summary-grid" style={{ gridTemplateColumns: hasPestaAdat && hasThreeM ? "1fr 1fr" : "1fr" }}>
        {hasPestaAdat && (
          <div className="sub-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Pesta Adat
              </span>
              <span className="badge badge-neutral" style={{ fontSize: "0.625rem" }}>
                {t("projectCount", { count: data.pestaAdat.count, plural: data.pestaAdat.count > 1 ? "s" : "" })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-4)" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>{t("planned")}</div>
                <div className="currency" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatRupiah(data.pestaAdat.planned)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>{t("spent")}</div>
                <div className="currency" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatRupiah(data.pestaAdat.spent)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>{t("diff")}</div>
                <div className="currency" style={{ fontSize: "0.875rem", fontWeight: 600, color: pestaAdatDiff >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {pestaAdatDiff >= 0 ? "+" : ""}{formatRupiah(pestaAdatDiff)}
                </div>
              </div>
            </div>
          </div>
        )}
        {hasThreeM && (
          <div className="sub-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                {t("ceremony3M")}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: "0.625rem" }}>
                {t("projectCount", { count: data.threeM.count, plural: data.threeM.count > 1 ? "s" : "" })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-4)" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>{t("planned")}</div>
                <div className="currency" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatRupiah(data.threeM.planned)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>{t("spent")}</div>
                <div className="currency" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatRupiah(data.threeM.spent)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: "2px" }}>{t("diff")}</div>
                <div className="currency" style={{ fontSize: "0.875rem", fontWeight: 600, color: threeMDiff >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {threeMDiff >= 0 ? "+" : ""}{formatRupiah(threeMDiff)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div style={{ padding: "var(--sp-2) 0" }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={{ stroke: "var(--border-light)" }} tickLine={false} />
            <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => formatRupiah(v)}
              contentStyle={chartTooltipStyle}
              itemStyle={{ color: "var(--text)" }}
              labelStyle={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "8px", color: "var(--text-secondary)" }} />
            <Bar dataKey={t("planned")} fill="var(--chart-planned)" stroke="var(--chart-planned-strong)" strokeWidth={1} radius={[8, 8, 0, 0]} />
            <Bar dataKey={t("spent")} radius={[8, 8, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry[t("spent")] > entry[t("planned")] ? "var(--danger)" : "var(--chart-actual-good)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked percentage comparison */}
      {hasPestaAdat && hasThreeM && (
        <div style={{ marginTop: "var(--sp-4)", paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500, marginBottom: "var(--sp-3)" }}>{t("spendingProgress")}</div>
          {[
            { label: "Pesta Adat", planned: data.pestaAdat.planned, spent: data.pestaAdat.spent },
            { label: t("ceremony3M"), planned: data.threeM.planned, spent: data.threeM.spent },
          ].map((item) => {
            const pct = item.planned > 0 ? (item.spent / item.planned) * 100 : 0;
            return (
              <div key={item.label} style={{ marginBottom: "var(--sp-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "var(--sp-1)" }}>
                  <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{item.label}</span>
                  <span className="currency" style={{ color: pct > 100 ? "var(--danger)" : "var(--text-tertiary)" }}>{pct.toFixed(1)}%</span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [projectPage, setProjectPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredProjects = useMemo(() => {
    if (!normalizedSearchQuery) return projects;

    return projects.filter((project) => {
      const weddingDate = project.weddingDate ? new Date(project.weddingDate) : null;
      const formattedDate = weddingDate
        ? weddingDate.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
        : "";
      const eventType = project.eventType === "THREE_M" ? t("ceremony3M") : "Pesta Adat";
      const status = project.isFinalized ? t("finalized") : t("inProgress");
      const searchableText = [
        project.groomName,
        project.brideName,
        `${project.groomName || ""} ${project.brideName || ""}`,
        `${project.groomName || ""} & ${project.brideName || ""}`,
        formattedDate,
        eventType,
        status,
        formatRupiah(project.totalBudget || 0),
        project.totalBudget,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [projects, normalizedSearchQuery, t]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE));
  const projectPageNumbers = getPageNumbers(projectPage, totalPages);
  const paginatedProjects = filteredProjects.slice((projectPage - 1) * PROJECTS_PER_PAGE, projectPage * PROJECTS_PER_PAGE);
  const firstProjectIndex = filteredProjects.length === 0 ? 0 : (projectPage - 1) * PROJECTS_PER_PAGE + 1;
  const lastProjectIndex = Math.min(projectPage * PROJECTS_PER_PAGE, filteredProjects.length);

  useEffect(() => {
    api
      .listProjects()
      .then((data) => setProjects(data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setProjectPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setProjectPage(1);
  }, [normalizedSearchQuery]);

  if (loading) return <div className="loading-state">{t("loadingProjects")}</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("myWeddingProjects")}</h1>
          <p className="page-subtitle">{t("projectsSubtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/projects/new")} style={{ gap: "var(--sp-2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("newProject")}
        </button>
      </div>

      {projects.length > 0 && <BudgetComparisonChart projects={projects} />}

      {projects.length === 0 ? (
        <div className="card empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "var(--sp-4)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p>{t("noProjects")}</p>
          <Link to="/projects/new" className="btn btn-primary btn-lg">{t("createFirstProject")}</Link>
        </div>
      ) : (
        <>
        <div className="filter-bar">
          <div style={{ position: "relative", flex: "1 1 280px", minWidth: 220 }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder={t("searchProjectsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("searchProjects")}
              style={{ width: "100%", paddingLeft: 38 }}
            />
          </div>
          {searchQuery && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearchQuery("")}>
              {t("clearSearch")}
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            {filteredProjects.length > PROJECTS_PER_PAGE
              ? t("showingProjects", { start: firstProjectIndex, end: lastProjectIndex, total: filteredProjects.length })
              : t("projectCount", { count: filteredProjects.length, plural: filteredProjects.length > 1 ? "s" : "" })}
          </span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="card empty-state">
            <p>{t("noProjectsMatchSearch")}</p>
          </div>
        ) : (
        <>
        <div style={{ display: "grid", gap: "var(--sp-3)" }}>
          {paginatedProjects.map((p, index) => {
            const totalActual = (p.events || []).flatMap((e) => e.categories || []).reduce((s, c) => s + Number(c.actualCost), 0);
            const pct = Number(p.totalBudget) > 0 ? (totalActual / Number(p.totalBudget)) * 100 : 0;

            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                style={{ textDecoration: "none", color: "inherit", animationDelay: `${index * 50}ms` }}
                className="fade-in"
              >
                <div className="card card-hover" style={{ cursor: "pointer" }}>
                  <div className="responsive-toolbar" style={{ alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-1)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                          {p.groomName} & {p.brideName}
                        </h3>
                        <span className={`badge ${p.isFinalized ? "badge-success" : "badge-warning"}`}>
                          {p.isFinalized ? t("finalized") : t("inProgress")}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {new Date(p.weddingDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                        <span style={{ margin: "0 var(--sp-2)", color: "var(--gray-300)" }}>/</span>
                        {p.eventType === "THREE_M" ? t("ceremony3M") : "Pesta Adat"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="currency" style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                        {formatRupiah(p.totalBudget)}
                      </div>
                      <div className="currency" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                        {pct.toFixed(1)}% {t("used")}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "var(--sp-4)" }}>
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
        {totalPages > 1 && (
          <div className="pagination-actions" aria-label={t("projectsPagination")}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginRight: "var(--sp-2)" }}>
              {t("showingProjects", { start: firstProjectIndex, end: lastProjectIndex, total: filteredProjects.length })}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setProjectPage((page) => Math.max(1, page - 1))}
              disabled={projectPage === 1}
            >
              {t("previous")}
            </button>
            {projectPageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`btn btn-sm ${page === projectPage ? "btn-primary" : "btn-outline"}`}
                onClick={() => setProjectPage(page)}
                aria-current={page === projectPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setProjectPage((page) => Math.min(totalPages, page + 1))}
              disabled={projectPage === totalPages}
            >
              {t("next")}
            </button>
          </div>
        )}
        </>
        )}
        </>
      )}
    </div>
  );
}
