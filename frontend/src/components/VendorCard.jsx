function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function VendorCard({ vendor, onSelect, actions, selected, vendorTypes = [], colorMap = {} }) {
  const typeInfo = vendorTypes.find((vt) => vt.code === vendor.type);
  const label = typeInfo?.label || vendor.type;
  const isPricePerPax = typeInfo?.isPricePerPax || false;
  const color = colorMap[vendor.type];

  return (
    <div className={`vendor-card${selected ? " selected" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)", flexWrap: "wrap" }}>
        <span
          className="vendor-type-badge"
          style={color ? { background: color.bg, color: color.text } : {}}
        >
          {label}
        </span>
        {vendor.isBatakSpecialist && (
          <span className="batak-badge">Batak Specialist</span>
        )}
      </div>

      <h4 style={{ marginBottom: "var(--sp-1)", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{vendor.name}</h4>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>
        {vendor.location}
      </p>

      <p className="currency" style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "var(--sp-1)", color: "var(--text)" }}>
        {formatRupiah(vendor.minPriceEstimate)} - {formatRupiah(vendor.maxPriceEstimate)}
        {isPricePerPax && <span style={{ fontWeight: 400, fontSize: "0.75rem", color: "var(--text-tertiary)" }}> /pax</span>}
      </p>

      {vendor.capacity && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
          Capacity: {vendor.capacity} pax
        </p>
      )}

      {vendor.description && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "var(--sp-2)", lineHeight: 1.5 }}>
          {vendor.description}
        </p>
      )}

      {(onSelect || actions) && (
        <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-4)", flexWrap: "wrap" }}>
          {onSelect && (
            <button className="btn btn-outline btn-sm" onClick={() => onSelect(vendor)}>
              View Details
            </button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
