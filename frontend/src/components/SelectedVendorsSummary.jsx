function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

const TYPE_LABELS = {
  VENUE: "Venue",
  CATERING: "Catering",
  ATTIRE: "Attire",
  GONDANG: "Gondang",
  WO: "WO",
  DOCUMENTATION: "Docs",
  CHURCH: "Church",
};

export default function SelectedVendorsSummary({ projectVendors, totalBudget, onRemove, isFinalized }) {
  const vendors = projectVendors || [];
  const totalEstimated = vendors.reduce((s, pv) => {
    return s + Number(pv.estimatedCost || pv.vendor?.minPriceEstimate || 0);
  }, 0);

  const budgetNum = Number(totalBudget);
  const pct = budgetNum > 0 ? ((totalEstimated / budgetNum) * 100).toFixed(1) : 0;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.05rem" }}>
          Selected Vendors
          {vendors.length > 0 && (
            <span className="badge badge-success" style={{ marginLeft: "0.5rem", fontSize: "0.7rem", verticalAlign: "middle" }}>
              {vendors.length}
            </span>
          )}
        </h3>
      </div>

      {/* Budget summary - always show */}
      <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "var(--radius)", marginBottom: vendors.length > 0 ? "1rem" : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Vendor Cost</span>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{formatRupiah(totalEstimated)}</span>
        </div>
        <div className="progress-bar">
          <div
            className="fill"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pct > 100 ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--success)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          <span>{pct}% of budget</span>
          <span>{formatRupiah(budgetNum)}</span>
        </div>
      </div>

      {vendors.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>
          No vendors selected yet. Choose from the recommendations.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {vendors.map((pv) => {
            const v = pv.vendor;
            const est = Number(pv.estimatedCost || v?.minPriceEstimate || 0);
            return (
              <div
                key={pv.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.6rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.15rem" }}>
                    <span className={`vendor-type-badge vendor-type-${v?.type}`} style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem" }}>
                      {TYPE_LABELS[v?.type] || v?.type}
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{formatRupiah(est)}</span>
                  </div>
                </div>
                {!isFinalized && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onRemove(v?.id)}
                    title="Remove"
                    style={{ padding: "0.25rem 0.4rem", flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
