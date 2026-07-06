function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function SelectedVendorsSummary({ projectVendors, totalBudget, onRemove, isFinalized, vendorTypes = [], colorMap = {} }) {
  const vendors = projectVendors || [];
  const totalEstimated = vendors.reduce((s, pv) => {
    return s + Number(pv.estimatedCost || pv.vendor?.minPriceEstimate || 0);
  }, 0);

  const typeLabels = {};
  vendorTypes.forEach((vt) => { typeLabels[vt.code] = vt.label; });

  const budgetNum = Number(totalBudget);
  const pct = budgetNum > 0 ? ((totalEstimated / budgetNum) * 100).toFixed(1) : 0;

  return (
    <div className="card" style={{ marginBottom: "var(--sp-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
          Selected Vendors
          {vendors.length > 0 && (
            <span className="badge badge-success" style={{ marginLeft: "var(--sp-2)", fontSize: "0.625rem", verticalAlign: "middle" }}>
              {vendors.length}
            </span>
          )}
        </h3>
      </div>

      {/* Budget summary */}
      <div className="sub-card" style={{ marginBottom: vendors.length > 0 ? "var(--sp-4)" : 0 }}>
        <div className="responsive-toolbar" style={{ marginBottom: "var(--sp-2)" }}>
          <span style={{ fontWeight: 500, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Vendor Cost</span>
          <span className="currency" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{formatRupiah(totalEstimated)}</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: "var(--sp-1)" }}>
          <span>{pct}% of budget</span>
          <span className="currency">{formatRupiah(budgetNum)}</span>
        </div>
      </div>

      {vendors.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", textAlign: "center", padding: "var(--sp-6) 0" }}>
          No vendors selected yet. Choose from the recommendations.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
          {vendors.map((pv) => {
            const v = pv.vendor;
            const est = Number(pv.estimatedCost || v?.minPriceEstimate || 0);
            const color = colorMap[v?.type];
            return (
              <div
                key={pv.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  padding: "var(--sp-3)",
                  background: "var(--surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.8125rem",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--gray-50)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--surface)"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>{v?.name}</div>
                  <div className="responsive-toolbar" style={{ justifyContent: "flex-start", gap: "var(--sp-2)", marginTop: "2px" }}>
                    <span
                      className="vendor-type-badge"
                      style={{
                        fontSize: "0.5625rem",
                        padding: "1px 5px",
                        ...(color ? { background: color.bg, color: color.text } : {}),
                      }}
                    >
                      {typeLabels[v?.type] || v?.type}
                    </span>
                    <span className="currency" style={{ color: "var(--text-tertiary)", fontSize: "0.6875rem" }}>{formatRupiah(est)}</span>
                  </div>
                </div>
                {!isFinalized && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onRemove(v?.id)}
                    title="Remove"
                    style={{ padding: "4px", flexShrink: 0, color: "var(--text-tertiary)", height: "auto" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
