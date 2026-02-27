import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";

const EVENT_TYPE_LABELS = { PESTA_ADAT: "Pesta Adat", THREE_M: "3M Ceremony" };

const EMPTY_FORM = { name: "", eventType: "PESTA_ADAT", sortOrder: "" };

export default function AdminMasterCategoriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [filterType, setFilterType] = useState("PESTA_ADAT");

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/");
      return;
    }
    loadCategories();
  }, [user]);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api.listMasterCategories(filterType || undefined);
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.isAdmin) loadCategories();
  }, [filterType]);

  function openAdd() {
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM, eventType: filterType || "PESTA_ADAT" });
    setError("");
    setShowModal(true);
  }

  function openEdit(cat) {
    setEditingCategory(cat);
    setForm({ name: cat.name, eventType: cat.eventType, sortOrder: String(cat.sortOrder) });
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
        name: form.name,
        eventType: form.eventType,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      };

      if (editingCategory) {
        await api.adminUpdateMasterCategory(editingCategory.id, data);
      } else {
        await api.adminCreateMasterCategory(data);
      }
      setShowModal(false);
      loadCategories();
      setAlertModal({
        title: editingCategory ? "Category Updated" : "Category Created",
        message: `"${data.name}" has been ${editingCategory ? "updated" : "created"} successfully.`,
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
      await api.adminDeleteMasterCategory(id);
      setConfirmAction(null);
      loadCategories();
      setAlertModal({ title: "Category Deleted", message: "Master category has been deleted successfully.", type: "success" });
    } catch (err) {
      setConfirmAction(null);
      setAlertModal({ title: "Delete Failed", message: err.message, type: "error" });
    }
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Admin: Master Categories</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="event-tabs" style={{ marginBottom: "1rem" }}>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`event-tab${filterType === key ? " active" : ""}`}
            onClick={() => setFilterType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : categories.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No master categories found for this event type.</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Order</th>
                  <th>Name</th>
                  <th>Event Type</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>{cat.sortOrder}</td>
                    <td style={{ fontWeight: 500 }}>{cat.name}</td>
                    <td><span className="badge badge-success" style={{ fontSize: "0.75rem" }}>{EVENT_TYPE_LABELS[cat.eventType]}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(cat)} title="Edit" style={{ padding: "0.35rem 0.5rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                          </svg>
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmAction({ id: cat.id, name: cat.name })} title="Delete" style={{ padding: "0.35rem 0.5rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <h3>{editingCategory ? "Edit Category" : "Add Category"}</h3>
            {error && <div style={{ background: "#ffebee", color: "var(--danger)", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.8rem", fontSize: "0.85rem" }}>{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required maxLength={100} placeholder="e.g. Sinamot (Bride Price)" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Event Type</label>
                  <select value={form.eventType} onChange={(e) => update("eventType", e.target.value)}>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} placeholder="e.g. 1" min="0" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${confirmAction.name}"? This cannot be undone.`}
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
