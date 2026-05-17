const KEY = "storage_customer_session";

export function getCustomerSession() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function setCustomerSession(customer) {
  localStorage.setItem(KEY, JSON.stringify(customer));
}

export function clearCustomerSession() {
  localStorage.removeItem(KEY);
}

export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}