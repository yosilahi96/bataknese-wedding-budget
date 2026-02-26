import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RupiahInput from "../components/RupiahInput";
import ConfirmModal from "../components/ConfirmModal";
import AlertModal from "../components/AlertModal";

const VENDOR_TYPES = ["VENUE", "CATERING", "ATTIRE", "GONDANG", "WO", "DOCUMENTATION", "CHURCH"];
const JAKARTA_AREAS = [
  "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan",
  "Jakarta Timur", "Tangerang", "Tangerang Selatan", "Bekasi", "Depok", "Bogor",
];

const TYPE_LABELS = {
  VENUE: "Venue", CATERING: "Catering", ATTIRE: "Attire", GONDANG: "Gondang",
  WO: "WO", DOCUMENTATION: "Documentation", CHURCH: "Church",
};

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "", type: "VENUE", location: "Jakarta Pusat",
  minPriceEstimate: "", maxPriceEstimate: "",
  capacity: "", description: "", contactInfo: "",
  isBatakSpecialist: false,
};

export default function AdminVendorsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/");
      return;
    }
    loadVendors();
  }, [user]);

  async function loadVendors() {
    setLoading(true);
    try {
      const params = filterType ? { type: filterType } : {};
      const data = await api.listVendors(params);
      setVendors(data.vendors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.isAdmin) { setCurrentPage(1); loadVendors(); } }, [filterType]);

  function openAdd() {
    setEditingVendor(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(vendor) {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      type: vendor.type,
      location: vendor.location,
      minPriceEstimate: String(Number(vendor.minPriceEstimate)),
      maxPriceEstimate: String(Number(vendor.maxPriceEstimate)),
      capacity: vendor.capacity ? String(vendor.capacity) : "",
      description: vendor.description || "",
      contactInfo: vendor.contactInfo || "",
      isBatakSpecialist: vendor.isBatakSpecialist,
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
        name: form.name,
        type: form.type,
        location: form.location,
        minPriceEstimate: Number(form.minPriceEstimate),
        maxPriceEstimate: Number(form.maxPriceEstimate),
        capacity: form.capacity ? Number(form.capacity) : null,
        description: form.description || null,
        contactInfo: form.contactInfo || null,
        isBatakSpecialist: form.isBatakSpecialist,
      };

      if (editingVendor) {
        await api.adminUpdateVendor(editingVendor.id, data);
      } else {
        await api.adminCreateVendor(data);
      }
      setShowModal(false);
      loadVendors();
      setAlertModal({ title: editingVendor ? "Vendor Updated" : "Vendor Created", message: `"${data.name}" has been ${editingVendor ? "updated" : "created"} successfully.`, type: "success" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.adminDeleteVendor(id);
      setConfirmAction(null);
      loadVendors();
      setAlertModal({ title: "Vendor Deleted", message: "Vendor has been deleted successfully.", type: "success" });
    } catch (err) {
      setConfirmAction(null);
      setAlertModal({ title: "Delete Failed", message: err.message, type: "error" });
    }
  }

  if (!user?.isAdmin) return null;

  const totalPages = Math.ceil(vendors.length / PAGE_SIZE);
  const paginatedVendors = vendors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Admin: Manage Vendors</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Vendor</button>
      </div>

      <div className="filter-bar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {VENDOR_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {vendors.length > PAGE_SIZE
            ? `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, vendors.length)} of ${vendors.length} vendors`
            : `${vendors.length} vendors`}
        </span>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th style={{ textAlign: "right" }}>Price Range</th>
                  <th>Batak</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVendors.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.name}</td>
                    <td><span className={`vendor-type-badge vendor-type-${v.type}`}>{TYPE_LABELS[v.type]}</span></td>
                    <td style={{ fontSize: "0.85rem" }}>{v.location}</td>
                    <td style={{ textAlign: "right", fontSize: "0.85rem" }}>
                      {formatRupiah(v.minPriceEstimate)} - {formatRupiah(v.maxPriceEstimate)}
                    </td>
                    <td>{v.isBatakSpecialist ? <span className="batak-badge">Yes</span> : "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)} title="Edit" style={{ padding: "0.35rem 0.5rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                          </svg>
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmAction({ id: v.id, name: v.name })} title="Delete" style={{ padding: "0.35rem 0.5rem" }}>
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &laquo; Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn btn-sm ${page === currentPage ? "btn-primary" : "btn-outline"}`}
              onClick={() => setCurrentPage(page)}
              style={{ minWidth: 36 }}
            >
              {page}
            </button>
          ))}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next &raquo;
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <h3>{editingVendor ? "Edit Vendor" : "Add Vendor"}</h3>
            {error && <div style={{ background: "#ffebee", color: "var(--danger)", padding: "0.5rem", borderRadius: "var(--radius)", marginBottom: "0.8rem", fontSize: "0.85rem" }}>{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. Gedung HKBP Menteng" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => update("type", e.target.value)}>
                    {VENDOR_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <select value={form.location} onChange={(e) => update("location", e.target.value)}>
                    {JAKARTA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Min Price (Rp)</label>
                  <RupiahInput value={form.minPriceEstimate} onChange={(v) => update("minPriceEstimate", v)} required placeholder="e.g. 10.000.000" />
                </div>
                <div className="form-group">
                  <label>Max Price (Rp)</label>
                  <RupiahInput value={form.maxPriceEstimate} onChange={(v) => update("maxPriceEstimate", v)} required placeholder="e.g. 50.000.000" />
                </div>
              </div>
              <div className="form-group">
                <label>Capacity (optional)</label>
                <input type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="e.g. 500" min="0" />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <input type="text" value={form.contactInfo} onChange={(e) => update("contactInfo", e.target.value)} placeholder="e.g. 0812-xxxx-xxxx" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="2" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Brief description of the vendor" />
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isBatakSpecialist} onChange={(e) => update("isBatakSpecialist", e.target.checked)} />
                  Batak Specialist
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingVendor ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title="Delete Vendor"
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
