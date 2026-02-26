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
  if (!projectVendors || projectVendors.length === 0) return null;

  const totalEstimated = projectVendors.reduce((s, pv) => {
    return s + Number(pv.estimatedCost || pv.vendor.minPriceEstimate);
  }, 0);

  const budgetNum = Number(totalBudget);
  const pct = budgetNum > 0 ? ((totalEstimated / budgetNum) * 100).toFixed(1) : 0;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Selected Vendors</h3>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>Est. Cost</th>
              {!isFinalized && <th style={{ width: 60 }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {projectVendors.map((pv) => {
              const v = pv.vendor;
              const est = Number(pv.estimatedCost || v.minPriceEstimate);
              return (
                <tr key={pv.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{v.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{v.location}</div>
                  </td>
                  <td>
                    <span className={`vendor-type-badge vendor-type-${v.type}`}>
                      {TYPE_LABELS[v.type] || v.type}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>{formatRupiah(est)}</td>
                  {!isFinalized && (
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onRemove(v.id)}
                        title="Remove"
                        style={{ padding: "0.35rem 0.5rem" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fafafa", borderRadius: "var(--radius)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: 600 }}>Total Vendor Estimated Cost</span>
          <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>{formatRupiah(totalEstimated)}</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
          <span>{pct}% of total budget</span>
          <span>Budget: {formatRupiah(budgetNum)}</span>
        </div>
      </div>
    </div>
  );
}
