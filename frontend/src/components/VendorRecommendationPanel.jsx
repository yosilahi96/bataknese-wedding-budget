import { useState, useEffect } from "react";
import { api } from "../api/client";
import VendorCard from "./VendorCard";
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

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function VendorRecommendationPanel({ projectId, guestCount, budget, onVendorAdded }) {
  const [recommendations, setRecommendations] = useState({});
  const [activeType, setActiveType] = useState("VENUE");
  const [loading, setLoading] = useState(true);
  const [compareVendors, setCompareVendors] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [compareError, setCompareError] = useState("");
  const [alertModal, setAlertModal] = useState(null);

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

  async function handleAddToProject(vendor) {
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
      if (onVendorAdded) onVendorAdded();
    } catch (err) {
      setAlertModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setActionLoading("");
    }
  }

  async function handleAddToBudget(vendor) {
    setActionLoading("budget-" + vendor.id);
    try {
      const avg = (Number(vendor.minPriceEstimate) + Number(vendor.maxPriceEstimate)) / 2;
      let estimatedCost = avg;
      if (vendor.type === "CATERING" && guestCount) {
        estimatedCost = avg * guestCount;
      }
      await api.addProjectVendor(projectId, {
        vendorId: vendor.id,
        estimatedCost,
      }).catch(() => {});
      const result = await api.addVendorToBudget(projectId, vendor.id, { estimatedCost });
      setAlertModal({ title: "Added to Budget", message: `Added to ${result.event}: ${result.category.name} = ${formatRupiah(estimatedCost)}`, type: "success" });
      if (onVendorAdded) onVendorAdded();
    } catch (err) {
      setAlertModal({ title: "Error", message: err.message, type: "error" });
    } finally {
      setActionLoading("");
    }
  }

  const activeVendors = recommendations[activeType] || [];

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1.1rem" }}>Vendor Recommendations</h3>
        {compareVendors.length >= 2 && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCompare(true)}>
            Compare ({compareVendors.length})
          </button>
        )}
      </div>

      <div className="event-tabs" style={{ marginBottom: "1rem" }}>
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
        <p style={{ color: "var(--text-secondary)" }}>No vendors found for this type. {guestCount ? "" : "Set guest count for better results."}</p>
      ) : (
        <div className="vendor-grid">
          {activeVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              selected={compareVendors.some((v) => v.id === vendor.id)}
              actions={
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleCompare(vendor)}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {compareVendors.some((v) => v.id === vendor.id) ? "Unselect" : "Compare"}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleAddToProject(vendor)}
                    disabled={actionLoading === vendor.id}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {actionLoading === vendor.id ? "..." : "Select"}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddToBudget(vendor)}
                    disabled={actionLoading === "budget-" + vendor.id}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {actionLoading === "budget-" + vendor.id ? "..." : "Add to Budget"}
                  </button>
                </>
              }
            />
          ))}
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
