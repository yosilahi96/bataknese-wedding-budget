import { useState, useEffect } from "react";
import { api } from "../api/client";
import VendorCard from "../components/VendorCard";

const VENDOR_TYPES = [
  { value: "", label: "All Types" },
  { value: "VENUE", label: "Venue" },
  { value: "CATERING", label: "Catering" },
  { value: "ATTIRE", label: "Attire & Ulos" },
  { value: "GONDANG", label: "Gondang" },
  { value: "WO", label: "Wedding Organizer" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "CHURCH", label: "Church" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name A-Z" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", isBatakSpecialist: "", sortBy: "name" });
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    loadVendors();
  }, [filters]);

  async function loadVendors() {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.isBatakSpecialist) params.isBatakSpecialist = filters.isBatakSpecialist;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      const data = await api.listVendors(params);
      setVendors(data.vendors || []);
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoading(false);
    }
  }

  const counts = {};
  vendors.forEach((v) => {
    counts[v.type] = (counts[v.type] || 0) + 1;
  });

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Vendor Directory</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Browse and find vendors for your Bataknese wedding in Jakarta.
      </p>

      <div className="filter-bar">
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
          {VENDOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filters.isBatakSpecialist === "true"}
            onChange={(e) => setFilters((f) => ({ ...f, isBatakSpecialist: e.target.checked ? "true" : "" }))}
          />
          Batak Specialist Only
        </label>

        <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {vendors.length} vendors found
        </span>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          No vendors found. Try adjusting your filters.
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onSelect={setSelectedVendor}
            />
          ))}
        </div>
      )}

      {selectedVendor && (
        <div className="modal-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span className={`vendor-type-badge vendor-type-${selectedVendor.type}`}>
                {VENDOR_TYPES.find((t) => t.value === selectedVendor.type)?.label || selectedVendor.type}
              </span>
              {selectedVendor.isBatakSpecialist && <span className="batak-badge">Batak Specialist</span>}
            </div>

            <h3 style={{ marginBottom: "0.5rem" }}>{selectedVendor.name}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{selectedVendor.location}</p>

            <div style={{ background: "#fafafa", borderRadius: "var(--radius)", padding: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>Price Range</div>
              <div style={{ fontSize: "1.1rem" }}>
                {formatRupiah(selectedVendor.minPriceEstimate)} - {formatRupiah(selectedVendor.maxPriceEstimate)}
                {selectedVendor.type === "CATERING" && <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}> per pax</span>}
              </div>
            </div>

            {selectedVendor.capacity && (
              <p style={{ marginBottom: "0.5rem" }}><strong>Capacity:</strong> {selectedVendor.capacity} pax</p>
            )}

            {selectedVendor.description && (
              <p style={{ marginBottom: "0.5rem", lineHeight: 1.5, color: "var(--text-secondary)" }}>{selectedVendor.description}</p>
            )}

            {selectedVendor.contactInfo && (
              <p style={{ marginBottom: "0.5rem" }}><strong>Contact:</strong> {selectedVendor.contactInfo}</p>
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
