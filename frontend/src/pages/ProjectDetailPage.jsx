import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../api/client";
import RupiahInput from "../components/RupiahInput";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";
import SelectedVendorsSummary from "../components/SelectedVendorsSummary";
import VendorRecommendationPanel from "../components/VendorRecommendationPanel";

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

  // Initialize active tab to first event
  useEffect(() => {
    if (project?.events?.length > 0 && !activeEventTab) {
      setActiveEventTab(project.events[0].id);
    }
  }, [project, activeEventTab]);

  if (loading) return <p>Loading project...</p>;
  if (!project) return <p>Project not found.</p>;

  const events = project.events || [];
  const allCategories = events.flatMap((e) => e.categories || []);
  const totalActual = allCategories.reduce((s, c) => s + Number(c.actualCost), 0);
  const remaining = Number(project.totalBudget) - totalActual;
  const pctUsed = Number(project.totalBudget) > 0 ? (totalActual / Number(project.totalBudget)) * 100 : 0;

  const activeEvent = events.find((e) => e.id === activeEventTab);
  const activeCategories = activeEvent?.categories || [];
  const activeEventPlanned = activeCategories.reduce((s, c) => s + Number(c.plannedBudget), 0);
  const activeEventActual = activeCategories.reduce((s, c) => s + Number(c.actualCost), 0);

  // Event comparison chart data
  const eventComparisonData = events.map((evt) => ({
    name: evt.name,
    Planned: (evt.categories || []).reduce((s, c) => s + Number(c.plannedBudget), 0),
    Actual: (evt.categories || []).reduce((s, c) => s + Number(c.actualCost), 0),
  }));

  // Per-event category chart data
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
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/")} style={{ marginBottom: "0.5rem" }}>
            &larr; Back
          </button>
          <h1 style={{ fontSize: "1.5rem" }}>{project.groomName} & {project.brideName}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {project.groomDomicile} &bull; {new Date(project.weddingDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            {project.isFinalized && <span className="badge badge-success" style={{ marginLeft: "0.5rem" }}>Finalized</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
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

      {/* Combined Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value">{formatRupiah(project.totalBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Actual</div>
          <div className="stat-value" style={{ color: pctUsed > 100 ? "var(--danger)" : undefined }}>{formatRupiah(totalActual)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ color: remaining < 0 ? "var(--danger)" : "var(--success)" }}>{formatRupiah(remaining)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">% Used</div>
          <div className="stat-value">{pctUsed.toFixed(1)}%</div>
          <div className="progress-bar" style={{ marginTop: "0.5rem" }}>
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
              <div className="stat-value">{formatRupiah(evtActual)}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                of {formatRupiah(evtPlanned)} planned ({evtPct.toFixed(1)}%)
              </div>
              <div className="progress-bar" style={{ marginTop: "0.4rem" }}>
                <div className="fill" style={{ width: `${Math.min(evtPct, 100)}%`, background: evtPct > 100 ? "var(--danger)" : evtPct > 80 ? "var(--warning)" : "var(--primary)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Comparison Chart — only when multiple events */}
      {events.length > 1 && (
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Event Spending Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={eventComparisonData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatRupiah(v)} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar dataKey="Planned" fill="#81c784" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#2e7d32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vendor Section - 2-column layout */}
      {!project.isFinalized && (
        <div className="vendor-layout" style={{ marginBottom: "1.5rem" }}>
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
            />
          </div>
        </div>
      )}

      {/* Finalized: show selected vendors inline */}
      {project.isFinalized && (project.vendors || []).length > 0 && (
        <SelectedVendorsSummary
          projectVendors={project.vendors || []}
          totalBudget={project.totalBudget}
          onRemove={handleRemoveVendor}
          isFinalized={project.isFinalized}
        />
      )}

      {/* Event Tabs — only show when multiple events */}
      {events.length > 1 && (
        <div className="event-tabs">
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
        <div className="card" style={{ marginBottom: "1.5rem", marginTop: "1.5rem", padding: "1rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>{activeEvent?.name} - Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeCategoryChartData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => (v / 1000000).toFixed(0) + "M"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatRupiah(v)} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar dataKey="Planned" fill="#81c784" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#2e7d32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Active Event Categories Table */}
      <div className="card" style={{ marginTop: activeCategories.length > 0 ? 0 : "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1rem" }}>{activeEvent?.name} - Categories</h3>
          {!project.isFinalized && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Add Category</button>
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
                    <td style={{ fontWeight: 500 }}>{cat.name}</td>
                    <td style={{ textAlign: "right" }}>{formatRupiah(cat.plannedBudget)}</td>
                    <td style={{ textAlign: "right" }}>{formatRupiah(cat.actualCost)}</td>
                    <td style={{ textAlign: "right", color: diff < 0 ? "var(--danger)" : "var(--success)" }}>
                      {diff >= 0 ? "+" : ""}{formatRupiah(diff)}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.notes || "-"}
                    </td>
                    {!project.isFinalized && (
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setEditingCategory(cat)}
                            title="Edit"
                            style={{ padding: "0.35rem 0.5rem" }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                            title="Delete"
                            style={{ padding: "0.35rem 0.5rem" }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <tr style={{ fontWeight: 700, background: "#fafafa" }}>
                <td>TOTAL</td>
                <td style={{ textAlign: "right" }}>{formatRupiah(activeEventPlanned)}</td>
                <td style={{ textAlign: "right" }}>{formatRupiah(activeEventActual)}</td>
                <td style={{ textAlign: "right", color: activeEventPlanned - activeEventActual < 0 ? "var(--danger)" : "var(--success)" }}>
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
          <div>
            <strong>{(project.vendors || []).length}</strong> vendors &middot; {formatRupiah(
              (project.vendors || []).reduce((s, pv) => s + Number(pv.estimatedCost || pv.vendor?.minPriceEstimate || 0), 0)
            )}
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
            />
            <button className="btn btn-outline" onClick={() => setShowMobileDrawer(false)} style={{ width: "100%", marginTop: "1rem" }}>
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
          background: "var(--surface)", border: "1.5px solid var(--border)",
          borderTop: "none", borderRadius: "0 0 var(--radius) var(--radius)",
          maxHeight: 200, overflowY: "auto", zIndex: 10,
          listStyle: "none", margin: 0, padding: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {filtered.map((name) => (
            <li
              key={name}
              onClick={() => { setInputValue(name); onChange(name); setOpen(false); }}
              style={{
                padding: "0.5rem 0.8rem", cursor: "pointer", fontSize: "0.92rem",
                borderBottom: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
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
        {error && <div style={{ background: "#ffebee", color: "var(--danger)", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.8rem", fontSize: "0.85rem" }}>{error}</div>}
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
                style={{ marginTop: "0.5rem" }}
              />
            )}
            {form.name.length >= 80 && (
              <span style={{ fontSize: "0.75rem", color: form.name.length >= 100 ? "var(--danger)" : "var(--text-secondary)", marginTop: "0.25rem", display: "block" }}>
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
        {error && <div style={{ background: "#ffebee", color: "var(--danger)", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.8rem", fontSize: "0.85rem" }}>{error}</div>}
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
