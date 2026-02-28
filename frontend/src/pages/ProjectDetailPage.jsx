import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api/client";
import RupiahInput from "../components/RupiahInput";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";
import SelectedVendorsSummary from "../components/SelectedVendorsSummary";
import VendorRecommendationPanel from "../components/VendorRecommendationPanel";
import { buildVendorTypeColorMap } from "../utils/vendorTypeColors";

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEventTab, setActiveEventTab] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [exporting, setExporting] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [vendorTypes, setVendorTypes] = useState([]);

  useEffect(() => {
    api.listVendorTypes().then((data) => setVendorTypes(data.vendorTypes || [])).catch(console.error);
  }, []);

  const vendorTypeColorMap = buildVendorTypeColorMap(vendorTypes);

  const loadProject = useCallback(() => {
    api
      .getProject(id)
      .then((data) => setProject(data.project))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (project?.events?.length > 0 && !activeEventTab) {
      setActiveEventTab(project.events[0].id);
    }
  }, [project, activeEventTab]);

  if (loading) return <div className="loading-state">Loading project...</div>;
  if (!project) return <div className="loading-state">Project not found.</div>;

  const events = project.events || [];
  const allCategories = events.flatMap((e) => e.categories || []);
  const totalActual = allCategories.reduce((s, c) => s + Number(c.actualCost), 0);
  const remaining = Number(project.totalBudget) - totalActual;
  const pctUsed = Number(project.totalBudget) > 0 ? (totalActual / Number(project.totalBudget)) * 100 : 0;

  const activeEvent = events.find((e) => e.id === activeEventTab);
  const activeCategories = activeEvent?.categories || [];
  const activeEventPlanned = activeCategories.reduce((s, c) => s + Number(c.plannedBudget), 0);
  const activeEventActual = activeCategories.reduce((s, c) => s + Number(c.actualCost), 0);

  const eventComparisonData = events.map((evt) => ({
    name: evt.name,
    Planned: (evt.categories || []).reduce((s, c) => s + Number(c.plannedBudget), 0),
    Actual: (evt.categories || []).reduce((s, c) => s + Number(c.actualCost), 0),
  }));

  const activeCategoryChartData = activeCategories.map((c) => ({
    name: c.name.length > 15 ? c.name.slice(0, 13) + "..." : c.name,
    Planned: Number(c.plannedBudget),
    Actual: Number(c.actualCost),
  }));

  function handleFinalize() {
    setConfirmAction({
      title: "Finalize Project",
      message: "Are you sure you want to finalize this project? All editing will be permanently locked.",
      confirmLabel: "Finalize",
      confirmStyle: "primary",
      onConfirm: async () => {
        try {
          const data = await api.finalizeProject(id);
          setProject(data.project);
          setConfirmAction(null);
          setAlertModal({ title: "Project Finalized", message: "Project has been finalized successfully.", type: "success" });
        } catch (err) {
          setConfirmAction(null);
          setAlertModal({ title: "Finalize Failed", message: err.message, type: "error" });
        }
      },
    });
  }

  function handleDelete() {
    setConfirmAction({
      title: "Delete Project",
      message: "Are you sure you want to delete this project permanently? This action cannot be undone and all budget data will be lost.",
      confirmLabel: "Delete Project",
      confirmStyle: "danger",
      onConfirm: async () => {
        try {
          await api.deleteProject(id);
          navigate("/");
        } catch (err) {
          setConfirmAction(null);
          setAlertModal({ title: "Delete Failed", message: err.message, type: "error" });
        }
      },
    });
  }

  async function handleExportPDF() {
    setExporting("pdf");
    try {
      const blob = await api.exportPDF(id);
      downloadBlob(blob, `wedding-budget-${project.groomName}-${project.brideName}.pdf`);
    } catch (err) {
      setAlertModal({ title: "Export Failed", message: err.message, type: "error" });
    } finally {
      setExporting("");
    }
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      const blob = await api.exportExcel(id);
      downloadBlob(blob, `wedding-budget-${project.groomName}-${project.brideName}.xlsx`);
    } catch (err) {
      setAlertModal({ title: "Export Failed", message: err.message, type: "error" });
    } finally {
      setExporting("");
    }
  }

  function handleDeleteCategory(catId) {
    if (!activeEvent) return;
    setConfirmAction({
      title: "Delete Category",
      message: "Are you sure you want to delete this budget category? This action cannot be undone.",
      confirmLabel: "Delete",
      confirmStyle: "danger",
      onConfirm: async () => {
        try {
          await api.deleteCategory(id, activeEvent.id, catId);
          setConfirmAction(null);
          loadProject();
          setAlertModal({ title: "Category Deleted", message: "Budget category has been deleted.", type: "success" });
        } catch (err) {
          setConfirmAction(null);
          setAlertModal({ title: "Delete Failed", message: err.message, type: "error" });
        }
      },
    });
  }

  async function handleRemoveVendor(vendorId) {
    try {
      await api.removeProjectVendor(id, vendorId);
      loadProject();
    } catch (err) {
      setAlertModal({ title: "Remove Failed", message: err.message, type: "error" });
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--sp-8)" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")} style={{ marginBottom: "var(--sp-4)", gap: "var(--sp-1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Projects
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "var(--sp-4)" }}>
          <div>
            <h1 className="page-title">{project.groomName} & {project.brideName}</h1>
            <p className="page-subtitle" style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
              {project.groomDomicile}
              <span style={{ color: "var(--gray-300)" }}>/</span>
              {new Date(project.weddingDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
              {project.isFinalized && <span className="badge badge-success" style={{ marginLeft: "var(--sp-1)" }}>Finalized</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
            {!project.isFinalized && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setShowEditProjectModal(true)}>Edit Info</button>
                <button className="btn btn-primary btn-sm" onClick={handleFinalize}>Finalize</button>
              </>
            )}
            <button className="btn btn-outline btn-sm" onClick={handleExportPDF} disabled={!!exporting}>
              {exporting === "pdf" ? "..." : "PDF"}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleExportExcel} disabled={!!exporting}>
              {exporting === "excel" ? "..." : "Excel"}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>

      {/* Combined Stats — Primary budget is visual anchor */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value currency-xl">{formatRupiah(project.totalBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value currency" style={{ color: pctUsed > 100 ? "var(--danger)" : undefined }}>{formatRupiah(totalActual)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value currency" style={{ color: remaining < 0 ? "var(--danger)" : "var(--success)" }}>{formatRupiah(remaining)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">% Used</div>
          <div className="stat-value">{pctUsed.toFixed(1)}%</div>
          <div className="progress-bar" style={{ marginTop: "var(--sp-3)" }}>
            <div className="fill" style={{ width: `${Math.min(pctUsed, 100)}%`, background: pctUsed > 100 ? "var(--danger)" : pctUsed > 80 ? "var(--warning)" : "var(--primary)" }} />
          </div>
        </div>
        {project.guestCount && (
          <div className="stat-card">
            <div className="stat-label">Guests</div>
            <div className="stat-value">{project.guestCount}</div>
          </div>
        )}
      </div>

      {/* Per-Event Stats */}
      <div className="stats-grid">
        {events.map((evt) => {
          const evtPlanned = (evt.categories || []).reduce((s, c) => s + Number(c.plannedBudget), 0);
          const evtActual = (evt.categories || []).reduce((s, c) => s + Number(c.actualCost), 0);
          const evtPct = evtPlanned > 0 ? (evtActual / evtPlanned) * 100 : 0;
          return (
            <div className="stat-card" key={evt.id}>
              <div className="stat-label">{evt.name}</div>
              <div className="stat-value currency">{formatRupiah(evtActual)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "var(--sp-1)" }}>
                of {formatRupiah(evtPlanned)} planned ({evtPct.toFixed(1)}%)
              </div>
              <div className="progress-bar" style={{ marginTop: "var(--sp-2)" }}>
                <div className="fill" style={{ width: `${Math.min(evtPct, 100)}%`, background: evtPct > 100 ? "var(--danger)" : evtPct > 80 ? "var(--warning)" : "var(--primary)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Comparison Chart */}
      {events.length > 1 && (
        <div className="card" style={{ marginBottom: "var(--sp-8)" }}>
          <h3 className="section-title">Event Spending Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={eventComparisonData} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={{ stroke: "var(--gray-200)" }} tickLine={false} />
              <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatRupiah(v)}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", fontSize: "0.8125rem" }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: "0.75rem" }} />
              <Bar dataKey="Planned" fill="var(--gray-300)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vendor Section */}
      {!project.isFinalized && (
        <div className="vendor-layout" style={{ marginBottom: "var(--sp-8)" }}>
          <VendorRecommendationPanel
            projectId={id}
            guestCount={project.guestCount}
            onVendorAdded={loadProject}
            selectedVendorIds={(project.vendors || []).map((v) => v.vendorId)}
          />
          <div className="vendor-sidebar">
            <SelectedVendorsSummary
              projectVendors={project.vendors || []}
              totalBudget={project.totalBudget}
              onRemove={handleRemoveVendor}
              isFinalized={project.isFinalized}
              vendorTypes={vendorTypes}
              colorMap={vendorTypeColorMap}
            />
          </div>
        </div>
      )}

      {project.isFinalized && (project.vendors || []).length > 0 && (
        <SelectedVendorsSummary
          projectVendors={project.vendors || []}
          totalBudget={project.totalBudget}
          onRemove={handleRemoveVendor}
          isFinalized={project.isFinalized}
          vendorTypes={vendorTypes}
          colorMap={vendorTypeColorMap}
        />
      )}

      {/* Event Tabs */}
      {events.length > 1 && (
        <div className="event-tabs" style={{ marginBottom: "var(--sp-6)" }}>
          {events.map((evt) => (
            <button
              key={evt.id}
              className={`event-tab ${activeEventTab === evt.id ? "active" : ""}`}
              onClick={() => setActiveEventTab(evt.id)}
            >
              {evt.name}
            </button>
          ))}
        </div>
      )}

      {/* Active Event Category Chart */}
      {activeCategories.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--sp-4)" }}>
          <h3 className="section-title">{activeEvent?.name} - Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeCategoryChartData} margin={{ top: 8, right: 16, left: 16, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={{ stroke: "var(--gray-200)" }} tickLine={false} />
              <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatRupiah(v)}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", fontSize: "0.8125rem" }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12, fontSize: "0.75rem" }} />
              <Bar dataKey="Planned" fill="var(--gray-300)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Active Event Categories Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)" }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>{activeEvent?.name} - Categories</h3>
          {!project.isFinalized && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} style={{ gap: "var(--sp-1)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Category
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Planned</th>
                <th style={{ textAlign: "right" }}>Actual</th>
                <th style={{ textAlign: "right" }}>Diff</th>
                <th>Notes</th>
                {!project.isFinalized && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {activeCategories.map((cat) => {
                const diff = Number(cat.plannedBudget) - Number(cat.actualCost);
                return (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 500, fontSize: "0.8125rem" }}>{cat.name}</td>
                    <td className="currency" style={{ textAlign: "right" }}>{formatRupiah(cat.plannedBudget)}</td>
                    <td className="currency" style={{ textAlign: "right" }}>{formatRupiah(cat.actualCost)}</td>
                    <td className="currency" style={{ textAlign: "right", color: diff < 0 ? "var(--danger)" : "var(--success)", fontWeight: 500 }}>
                      {diff >= 0 ? "+" : ""}{formatRupiah(diff)}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.notes || "-"}
                    </td>
                    {!project.isFinalized && (
                      <td>
                        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingCategory(cat)}
                            title="Edit"
                            style={{ padding: "4px 6px", height: "auto" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                            title="Delete"
                            style={{ padding: "4px 6px", height: "auto", color: "var(--text-tertiary)" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 700, background: "var(--gray-50)" }}>
                <td style={{ fontSize: "0.8125rem" }}>TOTAL</td>
                <td className="currency" style={{ textAlign: "right" }}>{formatRupiah(activeEventPlanned)}</td>
                <td className="currency" style={{ textAlign: "right" }}>{formatRupiah(activeEventActual)}</td>
                <td className="currency" style={{ textAlign: "right", color: activeEventPlanned - activeEventActual < 0 ? "var(--danger)" : "var(--success)" }}>
                  {activeEventPlanned - activeEventActual >= 0 ? "+" : ""}{formatRupiah(activeEventPlanned - activeEventActual)}
                </td>
                <td colSpan={project.isFinalized ? 1 : 2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && activeEvent && (
        <CategoryModal
          title={`Add Category - ${activeEvent.name}`}
          initial={{ name: "", plannedBudget: "", actualCost: "", notes: "" }}
          eventType={activeEvent.type}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            await api.createCategory(id, activeEvent.id, data);
            loadProject();
            setShowAddModal(false);
            setAlertModal({ title: "Category Added", message: `"${data.name}" has been added successfully.`, type: "success" });
          }}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && activeEvent && (
        <CategoryModal
          title={`Edit Category - ${activeEvent.name}`}
          initial={{
            name: editingCategory.name,
            plannedBudget: Number(editingCategory.plannedBudget),
            actualCost: Number(editingCategory.actualCost),
            notes: editingCategory.notes || "",
          }}
          eventType={activeEvent.type}
          onClose={() => setEditingCategory(null)}
          onSave={async (data) => {
            await api.updateCategory(id, activeEvent.id, editingCategory.id, data);
            loadProject();
            setEditingCategory(null);
            setAlertModal({ title: "Category Updated", message: `"${data.name}" has been updated successfully.`, type: "success" });
          }}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditProjectModal(false)}
          onSave={async (data) => {
            const res = await api.updateProject(id, data);
            setProject(res.project);
            setShowEditProjectModal(false);
            setAlertModal({ title: "Project Updated", message: "Project info has been updated successfully.", type: "success" });
          }}
        />
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          confirmStyle={confirmAction.confirmStyle}
          onConfirm={confirmAction.onConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {/* Alert Modal */}
      {alertModal && (
        <AlertModal
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onClose={() => setAlertModal(null)}
        />
      )}

      {/* Mobile floating vendor bar */}
      {!project.isFinalized && (
        <div className="mobile-vendor-bar">
          <div style={{ fontSize: "0.8125rem" }}>
            <strong>{(project.vendors || []).length}</strong> vendors
            <span style={{ color: "var(--gray-300)", margin: "0 var(--sp-2)" }}>/</span>
            <span className="currency">{formatRupiah(
              (project.vendors || []).reduce((s, pv) => s + Number(pv.estimatedCost || pv.vendor?.minPriceEstimate || 0), 0)
            )}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowMobileDrawer(true)}>
            View Selected
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      {showMobileDrawer && (
        <div className="vendor-drawer-overlay" onClick={() => setShowMobileDrawer(false)}>
          <div className="vendor-drawer" onClick={(e) => e.stopPropagation()}>
            <SelectedVendorsSummary
              projectVendors={project.vendors || []}
              totalBudget={project.totalBudget}
              onRemove={handleRemoveVendor}
              isFinalized={project.isFinalized}
              vendorTypes={vendorTypes}
              colorMap={vendorTypeColorMap}
            />
            <button className="btn btn-outline" onClick={() => setShowMobileDrawer(false)} style={{ width: "100%", marginTop: "var(--sp-4)" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCombobox({ suggestions, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef(null);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required
        maxLength={100}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderTop: "none", borderRadius: "0 0 var(--radius) var(--radius)",
          maxHeight: 200, overflowY: "auto", zIndex: 10,
          listStyle: "none", margin: 0, padding: 0,
          boxShadow: "var(--shadow-lg)",
        }}>
          {filtered.map((name) => (
            <li
              key={name}
              onClick={() => { setInputValue(name); onChange(name); setOpen(false); }}
              style={{
                padding: "var(--sp-2) var(--sp-3)", cursor: "pointer", fontSize: "0.875rem",
                borderBottom: "1px solid var(--border-light)",
                transition: "background var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-50)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryModal({ title, initial, eventType, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (eventType) {
      api.listMasterCategories(eventType).then((data) => {
        setSuggestions((data.categories || []).map((c) => c.name));
      }).catch(() => {});
    }
  }, [eventType]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave({
        name: form.name === "Others" && form.customName ? form.customName : form.name,
        plannedBudget: Number(form.plannedBudget) || 0,
        actualCost: Number(form.actualCost) || 0,
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {error && <div className="inline-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name</label>
            {eventType && suggestions.length > 0 ? (
              <CategoryCombobox
                suggestions={suggestions}
                value={form.name}
                onChange={(val) => update("name", val)}
                placeholder="Search or type category name..."
              />
            ) : (
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={100} placeholder="e.g. Catering, Dekorasi" />
            )}
            {form.name === "Others" && (
              <input
                type="text"
                value={form.customName || ""}
                onChange={(e) => update("customName", e.target.value)}
                required
                maxLength={100}
                placeholder="Enter custom category name..."
                style={{ marginTop: "var(--sp-2)" }}
              />
            )}
            {form.name.length >= 80 && (
              <span style={{ fontSize: "0.6875rem", color: form.name.length >= 100 ? "var(--danger)" : "var(--text-tertiary)", marginTop: "var(--sp-1)", display: "block" }}>
                {form.name.length}/100 characters
              </span>
            )}
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Planned Budget (Rp)</label>
              <RupiahInput value={form.plannedBudget} onChange={(v) => update("plannedBudget", v)} placeholder="e.g. 50.000.000" />
            </div>
            <div className="form-group">
              <label>Actual Cost (Rp)</label>
              <RupiahInput value={form.actualCost} onChange={(v) => update("actualCost", v)} placeholder="e.g. 45.000.000" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows="2" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="e.g. Sudah DP 50%, sisa dilunasi H-7" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    groomName: project.groomName,
    brideName: project.brideName,
    groomDomicile: project.groomDomicile,
    brideDomicile: project.brideDomicile,
    weddingDate: project.weddingDate.split("T")[0],
    totalBudget: Number(project.totalBudget),
    guestCount: project.guestCount ? String(project.guestCount) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave({ ...form, totalBudget: Number(form.totalBudget), guestCount: form.guestCount ? Number(form.guestCount) : null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Project</h3>
        {error && <div className="inline-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>Groom Name</label>
              <input type="text" value={form.groomName} onChange={(e) => update("groomName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Bride Name</label>
              <input type="text" value={form.brideName} onChange={(e) => update("brideName", e.target.value)} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Groom Domicile</label>
              <input type="text" value={form.groomDomicile} onChange={(e) => update("groomDomicile", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Bride Domicile</label>
              <input type="text" value={form.brideDomicile} onChange={(e) => update("brideDomicile", e.target.value)} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Wedding Date</label>
              <input type="date" value={form.weddingDate} onChange={(e) => update("weddingDate", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Total Budget (Rp)</label>
              <RupiahInput value={form.totalBudget} onChange={(v) => update("totalBudget", v)} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Guest Count (optional)</label>
              <input type="number" value={form.guestCount} onChange={(e) => update("guestCount", e.target.value)} placeholder="e.g. 500" min="1" />
            </div>
            <div />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
