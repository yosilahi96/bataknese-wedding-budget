import { useState, useEffect } from "react";
import { api } from "../api/client";
import VendorCard from "../components/VendorCard";
import { buildVendorTypeColorMap } from "../utils/vendorTypeColors";

const SORT_OPTIONS = [
  { value: "name", label: "Name A-Z" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];
const PAGE_SIZE = 12;

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", isBatakSpecialist: "", sortBy: "name" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    api.listVendorTypes().then((data) => setVendorTypes(data.vendorTypes || [])).catch(console.error);
  }, []);

  useEffect(() => {
    loadVendors();
  }, [filters, currentPage]);

  async function loadVendors() {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (filters.type) params.type = filters.type;
      if (filters.isBatakSpecialist) params.isBatakSpecialist = filters.isBatakSpecialist;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      const data = await api.listVendors(params);
      setVendors(data.vendors || []);
      setPagination(data.pagination || { page: currentPage, limit: PAGE_SIZE, total: data.vendors?.length || 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateFilters(nextFilters) {
    setCurrentPage(1);
    setFilters((f) => ({ ...f, ...nextFilters }));
  }

  const typeLabels = {};
  const perPaxTypes = {};
  vendorTypes.forEach((vt) => {
    typeLabels[vt.code] = vt.label;
    if (vt.isPricePerPax) perPaxTypes[vt.code] = true;
  });
  const colorMap = buildVendorTypeColorMap(vendorTypes);
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Directory</h1>
          <p className="page-subtitle">Browse and find vendors for your Bataknese wedding in Jakarta.</p>
        </div>
        <span className="badge badge-neutral" style={{ fontSize: "0.75rem", padding: "var(--sp-1) var(--sp-3)" }}>
          {pagination.total} vendors
        </span>
      </div>

      <div className="filter-bar">
        <select value={filters.type} onChange={(e) => updateFilters({ type: e.target.value })}>
          <option value="">All Types</option>
          {vendorTypes.map((vt) => (
            <option key={vt.code} value={vt.code}>{vt.label}</option>
          ))}
        </select>

        <select value={filters.sortBy} onChange={(e) => updateFilters({ sortBy: e.target.value })}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: "0.8125rem", cursor: "pointer", color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={filters.isBatakSpecialist === "true"}
            onChange={(e) => updateFilters({ isBatakSpecialist: e.target.checked ? "true" : "" })}
            style={{ accentColor: "var(--primary)" }}
          />
          Batak Specialist Only
        </label>

        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
          {pagination.total > PAGE_SIZE
            ? `${startItem}-${endItem} of ${pagination.total} vendors`
            : `${pagination.total} vendors`}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="card empty-state">
          <p>No vendors found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onSelect={setSelectedVendor}
              vendorTypes={vendorTypes}
              colorMap={colorMap}
            />
          ))}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="pagination-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page === 1}
          >
            &laquo; Prev
          </button>
          <span style={{ minWidth: 96, textAlign: "center", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={pagination.page === pagination.totalPages}
          >
            Next &raquo;
          </button>
        </div>
      )}

      {selectedVendor && (
        <div className="modal-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
              <span
                className="vendor-type-badge"
                style={colorMap[selectedVendor.type] ? { background: colorMap[selectedVendor.type].bg, color: colorMap[selectedVendor.type].text } : {}}
              >
                {typeLabels[selectedVendor.type] || selectedVendor.type}
              </span>
              {selectedVendor.isBatakSpecialist && <span className="batak-badge">Batak Specialist</span>}
            </div>

            <h3 style={{ marginBottom: "var(--sp-2)" }}>{selectedVendor.name}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--sp-4)" }}>{selectedVendor.location}</p>

            <div className="sub-card" style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ fontWeight: 500, fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-1)" }}>Price Range</div>
              <div className="currency" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                {formatRupiah(selectedVendor.minPriceEstimate)} - {formatRupiah(selectedVendor.maxPriceEstimate)}
                {perPaxTypes[selectedVendor.type] && <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 400 }}> per pax</span>}
              </div>
            </div>

            {selectedVendor.capacity && (
              <p style={{ marginBottom: "var(--sp-2)", fontSize: "0.875rem" }}><strong>Capacity:</strong> {selectedVendor.capacity} pax</p>
            )}

            {selectedVendor.description && (
              <p style={{ marginBottom: "var(--sp-2)", lineHeight: 1.6, color: "var(--text-secondary)", fontSize: "0.875rem" }}>{selectedVendor.description}</p>
            )}

            {selectedVendor.contactInfo && (
              <p style={{ marginBottom: "var(--sp-2)", fontSize: "0.875rem" }}><strong>Contact:</strong> {selectedVendor.contactInfo}</p>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedVendor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
