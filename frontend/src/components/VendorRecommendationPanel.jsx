import { useState, useEffect } from "react";
import { api } from "../api/client";
import VendorCompareModal from "./VendorCompareModal";
import AlertModal from "./AlertModal";

const TYPE_TABS = [
  { key: "VENUE", label: "Venue" },
  { key: "CATERING", label: "Catering" },
  { key: "ATTIRE", label: "Attire" },
  { key: "GONDANG", label: "Gondang" },
  { key: "WO", label: "WO" },
  { key: "DOCUMENTATION", label: "Docs" },
  { key: "CHURCH", label: "Church" },
];

const JAKARTA_AREAS = [
  "Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan",
  "Jakarta Timur", "Tangerang", "Tangerang Selatan", "Bekasi", "Depok", "Bogor",
];

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-10000000", label: "Under 10M" },
  { value: "10000000-50000000", label: "10M - 50M" },
  { value: "50000000-100000000", label: "50M - 100M" },
  { value: "100000000-999999999999", label: "100M+" },
];

const CAPACITY_RANGES = [
  { value: "", label: "Any Capacity" },
  { value: "0-300", label: "< 300 pax" },
  { value: "300-500", label: "300 - 500 pax" },
  { value: "500-999999", label: "500+ pax" },
];

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function VendorRecommendationPanel({ projectId, guestCount, onVendorAdded, selectedVendorIds = [] }) {
  const [recommendations, setRecommendations] = useState({});
  const [activeType, setActiveType] = useState("VENUE");
  const [loading, setLoading] = useState(true);
  const [compareVendors, setCompareVendors] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [compareError, setCompareError] = useState("");
  const [alertModal, setAlertModal] = useState(null);
  const [priceSort, setPriceSort] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterCapacity, setFilterCapacity] = useState("");

  useEffect(() => {
    loadRecommendations();
  }, [projectId]);

  async function loadRecommendations() {
    setLoading(true);
    try {
      const data = await api.getRecommendations(projectId);
      setRecommendations(data.recommendations || {});
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleCompare(vendor) {
    const exists = compareVendors.find((v) => v.id === vendor.id);
    if (!exists && compareVendors.length >= 3) {
      setCompareError("You can only compare up to 3 vendors at a time. Please unselect one first.");
      setTimeout(() => setCompareError(""), 3000);
      return;
    }
    setCompareError("");
    setCompareVendors((prev) => {
      if (exists) return prev.filter((v) => v.id !== vendor.id);
      return [...prev, vendor];
    });
  }

  async function handleSelect(vendor) {
    if (selectedVendorIds.includes(vendor.id)) {
      setAlertModal({
        title: "Already Selected",
        message: `"${vendor.name}" has already been added. Please choose a different vendor or remove the existing one first.`,
        type: "warning",
      });
      return;
    }

    setActionLoading(vendor.id);
    try {
      const avg = (Number(vendor.minPriceEstimate) + Number(vendor.maxPriceEstimate)) / 2;
      let estimatedCost = avg;
      if (vendor.type === "CATERING" && guestCount) {
        estimatedCost = avg * guestCount;
      }
      await api.addProjectVendor(projectId, {
        vendorId: vendor.id,
        estimatedCost,
      });

      const result = await api.addVendorToBudget(projectId, vendor.id, { estimatedCost });
      setAlertModal({
        title: "Vendor Selected",
        message: `"${vendor.name}" has been added to your project and budget (${result.event}: ${result.category.name} = ${formatRupiah(estimatedCost)}).`,
        type: "success",
      });
      if (onVendorAdded) onVendorAdded();
    } catch (err) {
      if (err.message?.toLowerCase().includes("already")) {
        setAlertModal({ title: "Already Selected", message: `"${vendor.name}" has already been added. Please choose a different vendor or remove the existing one first.`, type: "error" });
      } else {
        setAlertModal({ title: "Error", message: err.message, type: "error" });
      }
    } finally {
      setActionLoading("");
    }
  }

  function matchesPrice(vendor) {
    if (!filterPrice) return true;
    const [min, max] = filterPrice.split("-").map(Number);
    const vMin = Number(vendor.minPriceEstimate);
    return vMin >= min && vMin <= max;
  }

  function matchesCapacity(vendor) {
    if (!filterCapacity) return true;
    if (!vendor.capacity) return false;
    const [min, max] = filterCapacity.split("-").map(Number);
    return vendor.capacity >= min && vendor.capacity <= max;
  }

  const activeVendors = [...(recommendations[activeType] || [])]
    .filter((v) => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || (v.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((v) => !filterLocation || v.location === filterLocation)
    .filter(matchesPrice)
    .filter(matchesCapacity)
    .sort((a, b) => {
      if (priceSort === "low") return Number(a.minPriceEstimate) - Number(b.minPriceEstimate);
      if (priceSort === "high") return Number(b.maxPriceEstimate) - Number(a.maxPriceEstimate);
      return 0;
    });

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1.1rem" }}>Vendor Recommendations</h3>
        {compareVendors.length >= 2 && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCompare(true)}>
            Compare ({compareVendors.length})
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="filter-bar" style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: 150 }}
        />
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
          <option value="">All Areas</option>
          {JAKARTA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterPrice} onChange={(e) => setFilterPrice(e.target.value)}>
          {PRICE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={filterCapacity} onChange={(e) => setFilterCapacity(e.target.value)}>
          {CAPACITY_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Type Tabs + Sort */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <div className="event-tabs" style={{ marginBottom: 0 }}>
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`event-tab${activeType === tab.key ? " active" : ""}`}
              onClick={() => { setActiveType(tab.key); setCompareVendors([]); setCompareError(""); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={priceSort}
          onChange={(e) => setPriceSort(e.target.value)}
          style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "0.8rem" }}
        >
          <option value="default">Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      {compareError && (
        <div style={{
          background: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
          borderRadius: "6px",
          padding: "0.6rem 1rem",
          marginBottom: "1rem",
          fontSize: "0.85rem",
        }}>
          {compareError}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading recommendations...</p>
      ) : activeVendors.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No vendors found. {searchQuery || filterLocation || filterPrice || filterCapacity ? "Try adjusting your filters." : guestCount ? "" : "Set guest count for better results."}</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th style={{ textAlign: "right" }}>Price Range</th>
                <th style={{ textAlign: "center" }}>Batak</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeVendors.map((vendor) => {
                const isComparing = compareVendors.some((v) => v.id === vendor.id);
                const isSelected = selectedVendorIds.includes(vendor.id);
                return (
                  <tr
                    key={vendor.id}
                    className={isSelected ? "vendor-selected" : ""}
                    style={{ background: isComparing && !isSelected ? "#f0f9ff" : undefined }}
                  >
                    <td>
                      <div style={{ fontWeight: 500 }}>{vendor.name}</div>
                      {vendor.description && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.15rem", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {vendor.description}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {vendor.location}
                      {vendor.capacity ? <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{vendor.capacity} pax</div> : null}
                    </td>
                    <td style={{ textAlign: "right", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {formatRupiah(vendor.minPriceEstimate)} - {formatRupiah(vendor.maxPriceEstimate)}
                      {vendor.type === "CATERING" && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}> /pax</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {vendor.isBatakSpecialist && <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>Yes</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => toggleCompare(vendor)}
                          style={{ fontSize: "0.7rem", padding: "0.25rem 0.4rem" }}
                        >
                          {isComparing ? "Unselect" : "Compare"}
                        </button>
                        {isSelected ? (
                          <button
                            className="btn btn-sm"
                            disabled
                            style={{ fontSize: "0.7rem", padding: "0.25rem 0.4rem", background: "#c8e6c9", color: "#2e7d32", border: "none" }}
                          >
                            Selected
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSelect(vendor)}
                            disabled={actionLoading === vendor.id}
                            style={{ fontSize: "0.7rem", padding: "0.25rem 0.4rem" }}
                          >
                            {actionLoading === vendor.id ? "..." : "Select"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCompare && (
        <VendorCompareModal
          vendors={compareVendors}
          guestCount={guestCount}
          onClose={() => setShowCompare(false)}
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
