export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateInputValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateInputValue(tomorrow);
}

export function isFutureDateInput(value) {
  return value > toDateInputValue(new Date());
}
