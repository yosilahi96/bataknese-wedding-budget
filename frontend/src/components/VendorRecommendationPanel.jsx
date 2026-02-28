import { useState, useEffect } from "react";
import { api } from "../api/client";
import VendorCompareModal from "./VendorCompareModal";
import AlertModal from "./AlertModal";

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
  const [vendorTypes, setVendorTypes] = useState([]);
  const [activeType, setActiveType] = useState("");
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
    api.listVendorTypes().then((data) => {
      const types = data.vendorTypes || [];
      setVendorTypes(types);
      if (types.length > 0 && !activeType) setActiveType(types[0].code);
    }).catch(console.error);
  }, []);

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

  const perPaxTypes = {};
  vendorTypes.forEach((vt) => { if (vt.isPricePerPax) perPaxTypes[vt.code] = true; });

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
      if (perPaxTypes[vendor.type] && guestCount) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: "var(--sp-3)" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>Vendor Recommendations</h3>
        {compareVendors.length >= 2 && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCompare(true)}>
            Compare ({compareVendors.length})
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="filter-bar">
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
        <div className="event-tabs" style={{ marginBottom: 0 }}>
          {vendorTypes.map((vt) => (
            <button
              key={vt.code}
              className={`event-tab${activeType === vt.code ? " active" : ""}`}
              onClick={() => { setActiveType(vt.code); setCompareVendors([]); setCompareError(""); }}
            >
              {vt.label}
            </button>
          ))}
        </div>
        <select
          value={priceSort}
          onChange={(e) => setPriceSort(e.target.value)}
          style={{ padding: "var(--sp-1) var(--sp-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "0.75rem", height: 30, background: "white", color: "var(--text-secondary)" }}
        >
          <option value="default">Default</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      {compareError && <div className="inline-error">{compareError}</div>}

      {loading ? (
        <div className="loading-state" style={{ padding: "var(--sp-8)" }}>Loading recommendations...</div>
      ) : activeVendors.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", padding: "var(--sp-8)", textAlign: "center" }}>
          No vendors found. {searchQuery || filterLocation || filterPrice || filterCapacity ? "Try adjusting your filters." : guestCount ? "" : "Set guest count for better results."}
        </p>
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
                    style={{ background: isComparing && !isSelected ? "var(--gray-50)" : undefined }}
                  >
                    <td>
                      <div style={{ fontWeight: 500, fontSize: "0.8125rem" }}>{vendor.name}</div>
                      {vendor.description && (
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: "2px", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {vendor.description}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {vendor.location}
                      {vendor.capacity ? <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>{vendor.capacity} pax</div> : null}
                    </td>
                    <td className="currency" style={{ textAlign: "right", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {formatRupiah(vendor.minPriceEstimate)} - {formatRupiah(vendor.maxPriceEstimate)}
                      {perPaxTypes[vendor.type] && <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}> /pax</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {vendor.isBatakSpecialist && <span className="badge badge-success" style={{ fontSize: "0.625rem" }}>Yes</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                        <button
                          className={`btn btn-sm ${isComparing ? "btn-outline" : "btn-ghost"}`}
                          onClick={() => toggleCompare(vendor)}
                          style={{ fontSize: "0.6875rem" }}
                        >
                          {isComparing ? "Unselect" : "Compare"}
                        </button>
                        {isSelected ? (
                          <span className="badge badge-success" style={{ fontSize: "0.625rem", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Selected
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSelect(vendor)}
                            disabled={actionLoading === vendor.id}
                            style={{ fontSize: "0.6875rem" }}
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
          vendorTypes={vendorTypes}
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
