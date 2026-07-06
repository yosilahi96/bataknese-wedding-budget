import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";
import { getVendorTypeBadgeColor } from "../utils/vendorTypeColors";

const EMPTY_FORM = { code: "", label: "", defaultCategoryName: "", isPricePerPax: false, sortOrder: "" };

export default function AdminVendorTypesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/");
      return;
    }
    loadVendorTypes();
  }, [user]);

  async function loadVendorTypes() {
    setLoading(true);
    try {
      const data = await api.listVendorTypes();
      setVendorTypes(data.vendorTypes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingType(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(vt) {
    setEditingType(vt);
    setForm({
      code: vt.code,
      label: vt.label,
      defaultCategoryName: vt.defaultCategoryName || "",
      isPricePerPax: vt.isPricePerPax,
      sortOrder: String(vt.sortOrder),
    });
    setError("");
    setShowModal(true);
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = {
        code: form.code,
        label: form.label,
        defaultCategoryName: form.defaultCategoryName || null,
        isPricePerPax: form.isPricePerPax,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      };

      if (editingType) {
        await api.adminUpdateVendorType(editingType.id, data);
      } else {
        await api.adminCreateVendorType(data);
      }
      setShowModal(false);
      loadVendorTypes();
      setAlertModal({
        title: editingType ? "Vendor Type Updated" : "Vendor Type Created",
        message: `"${data.label}" has been ${editingType ? "updated" : "created"} successfully.`,
        type: "success",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.adminDeleteVendorType(id);
      setConfirmAction(null);
      loadVendorTypes();
      setAlertModal({ title: "Vendor Type Deleted", message: "Vendor type has been deleted successfully.", type: "success" });
    } catch (err) {
      setConfirmAction(null);
      setAlertModal({ title: "Delete Failed", message: err.message, type: "error" });
    }
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Types</h1>
          <p className="page-subtitle">Manage configurable vendor type categories</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ gap: "var(--sp-1)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Type
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : vendorTypes.length === 0 ? (
        <div className="card empty-state">
          <p>No vendor types found. Add one to get started.</p>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Order</th>
                  <th>Code</th>
                  <th>Label</th>
                  <th>Default Category</th>
                  <th style={{ textAlign: "center" }}>Per Pax</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorTypes.map((vt, idx) => {
                  const color = getVendorTypeBadgeColor(idx);
                  return (
                    <tr key={vt.id}>
                      <td style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>{vt.sortOrder}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            letterSpacing: "0.03em",
                            background: color.bg,
                            color: color.text,
                          }}
                        >
                          {vt.code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: "0.8125rem" }}>{vt.label}</td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{vt.defaultCategoryName || "-"}</td>
                      <td style={{ textAlign: "center", fontSize: "0.8125rem" }}>
                        {vt.isPricePerPax ? <span className="badge badge-success">Yes</span> : "-"}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(vt)} title="Edit" style={{ padding: "4px 6px", height: "auto" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setConfirmAction({ id: vt.id, label: vt.label })}
                            title="Delete"
                            style={{ padding: "4px 6px", height: "auto", color: "var(--text-tertiary)" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>{editingType ? "Edit Vendor Type" : "Add Vendor Type"}</h3>
            {error && <div className="inline-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => update("code", e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                    required
                    maxLength={30}
                    placeholder="e.g. VENUE"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="form-group">
                  <label>Label</label>
                  <input type="text" value={form.label} onChange={(e) => update("label", e.target.value)} required maxLength={50} placeholder="e.g. Venue" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Default Category Name</label>
                  <input type="text" value={form.defaultCategoryName} onChange={(e) => update("defaultCategoryName", e.target.value)} maxLength={100} placeholder="e.g. Gedung (Venue)" />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} placeholder="e.g. 1" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isPricePerPax}
                    onChange={(e) => update("isPricePerPax", e.target.checked)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  Price is per pax (multiplied by guest count)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingType ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title="Delete Vendor Type"
          message={`Are you sure you want to delete "${confirmAction.label}"? This cannot be undone. Any vendors with this type must be reassigned first.`}
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={() => handleDelete(confirmAction.id)}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {alertModal && (
        <AlertModal
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onClose={() => setAlertModal(null)}
        />
      )}
    </div>
  );
}
