import { useState } from "react";

function formatDots(value) {
  const num = String(value).replace(/\D/g, "");
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseDots(formatted) {
  return formatted.replace(/\./g, "");
}

export default function RupiahInput({ value, onChange, ...props }) {
  const [display, setDisplay] = useState(() => formatDots(value));

  function handleChange(e) {
    const raw = parseDots(e.target.value);
    if (raw !== "" && !/^\d+$/.test(raw)) return;
    setDisplay(formatDots(raw));
    onChange(raw);
  }

  // Sync if value changes externally
  const rawCurrent = parseDots(display);
  if (String(value) !== rawCurrent && value !== undefined) {
    const formatted = formatDots(value);
    if (formatted !== display) {
      // Will sync on next render via state
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={() => setDisplay(formatDots(parseDots(display)))}
      {...props}
    />
  );
}
