const PALETTE = [
  { bg: "#dbeafe", text: "#1e40af" },  // blue
  { bg: "#fce7f3", text: "#9d174d" },  // pink
  { bg: "#d1fae5", text: "#065f46" },  // emerald
  { bg: "#fef3c7", text: "#92400e" },  // amber
  { bg: "#ede9fe", text: "#5b21b6" },  // violet
  { bg: "#ffedd5", text: "#9a3412" },  // orange
  { bg: "#ccfbf1", text: "#134e4a" },  // teal
  { bg: "#fce4ec", text: "#880e4f" },  // rose
  { bg: "#e0e7ff", text: "#3730a3" },  // indigo
  { bg: "#cffafe", text: "#155e75" },  // cyan
  { bg: "#fef9c3", text: "#854d0e" },  // yellow
  { bg: "#f3e8ff", text: "#6b21a8" },  // purple
];

export function getVendorTypeBadgeColor(index) {
  return PALETTE[index % PALETTE.length];
}

export function buildVendorTypeColorMap(vendorTypes) {
  const map = {};
  vendorTypes.forEach((vt, i) => {
    map[vt.code] = PALETTE[i % PALETTE.length];
  });
  return map;
}
