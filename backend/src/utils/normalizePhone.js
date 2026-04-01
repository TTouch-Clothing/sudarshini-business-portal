export function normalizePhone(phone = '') {
  let value = String(phone).trim().replace(/\s+/g, '');
  if (value.startsWith('+880')) value = '0' + value.slice(4);
  value = value.replace(/[^\d]/g, '');
  if (value.startsWith('880')) value = '0' + value.slice(3);
  return value;
}
