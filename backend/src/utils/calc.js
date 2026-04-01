export function sumItemQty(items = []) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23,59,59,999);
  return d;
}

export function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

export function yearKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}`;
}
