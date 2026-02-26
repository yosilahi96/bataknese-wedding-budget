function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

const TYPE_LABELS = {
  VENUE: "Venue",
  CATERING: "Catering",
  ATTIRE: "Attire & Ulos",
  GONDANG: "Gondang",
  WO: "Wedding Organizer",
  DOCUMENTATION: "Documentation",
  CHURCH: "Church",
};

export default function VendorCard({ vendor, onSelect, actions, selected }) {
  return (
    <div className={`vendor-card${selected ? " selected" : ""}`}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <span className={`vendor-type-badge vendor-type-${vendor.type}`}>
          {TYPE_LABELS[vendor.type] || vendor.type}
        </span>
        {vendor.isBatakSpecialist && (
          <span className="batak-badge">Batak Specialist</span>
        )}
      </div>

      <h4 style={{ marginBottom: "0.3rem", fontSize: "1rem" }}>{vendor.name}</h4>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
        {vendor.location}
      </p>

      <p style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.3rem" }}>
        {formatRupiah(vendor.minPriceEstimate)} - {formatRupiah(vendor.maxPriceEstimate)}
        {vendor.type === "CATERING" && <span style={{ fontWeight: 400, fontSize: "0.78rem" }}> /pax</span>}
      </p>

      {vendor.capacity && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Capacity: {vendor.capacity} pax
        </p>
      )}

      {vendor.description && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem", lineHeight: 1.4 }}>
          {vendor.description}
        </p>
      )}

      {(onSelect || actions) && (
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
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
