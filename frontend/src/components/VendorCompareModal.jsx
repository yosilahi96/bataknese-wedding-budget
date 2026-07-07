import { createPortal } from "react-dom";

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function VendorCompareModal({ vendors, guestCount, vendorTypes = [], onClose }) {
  if (!vendors || vendors.length < 2) return null;

  const perPaxTypes = {};
  vendorTypes.forEach((vt) => { if (vt.isPricePerPax) perPaxTypes[vt.code] = true; });

  const typeLabels = {};
  vendorTypes.forEach((vt) => { typeLabels[vt.code] = vt.label; });

  const prices = vendors.map((v) => (Number(v.minPriceEstimate) + Number(v.maxPriceEstimate)) / 2);
  const minPriceIdx = prices.indexOf(Math.min(...prices));

  const rows = [
    { label: "Type", values: vendors.map((v) => typeLabels[v.type] || v.type) },
    { label: "Location", values: vendors.map((v) => v.location) },
    { label: "Min Price", values: vendors.map((v) => formatRupiah(v.minPriceEstimate)), bestIdx: minPriceIdx },
    { label: "Max Price", values: vendors.map((v) => formatRupiah(v.maxPriceEstimate)) },
    { label: "Capacity", values: vendors.map((v) => v.capacity ? `${v.capacity} pax` : "N/A") },
    { label: "Batak Specialist", values: vendors.map((v) => v.isBatakSpecialist ? "Yes" : "No") },
    { label: "Contact", values: vendors.map((v) => v.contactInfo || "-") },
  ];

  if (guestCount && perPaxTypes[vendors[0]?.type]) {
    rows.push({
      label: `Est. Total (${guestCount} pax)`,
      values: vendors.map((v) => {
        const avg = (Number(v.minPriceEstimate) + Number(v.maxPriceEstimate)) / 2;
        return formatRupiah(avg * guestCount);
      }),
      bestIdx: minPriceIdx,
    });
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <h3 style={{ marginBottom: "1rem" }}>Vendor Comparison</h3>
        <div className="table-container">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                {vendors.map((v) => (
                  <th key={v.id}>{v.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{row.label}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className={row.bestIdx === i ? "best-value" : ""}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--success)", marginTop: "0.75rem" }}>
          Most budget-friendly: <strong>{vendors[minPriceIdx]?.name}</strong>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
