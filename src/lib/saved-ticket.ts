const key = "makkah_ticket";
export const savedTicketEvent = "makkah-ticket-changed";
const valid = (value: string | null): value is string =>
  Boolean(value && /^[a-f0-9]{64}$/.test(value));

// Persist only the ticket credential; visitor details are fetched from the server.
export function rememberTicket(token: string): boolean {
  if (typeof window === "undefined" || !valid(token)) return false;
  let persistent = false;
  try {
    localStorage.setItem(key, token);
    persistent = true;
  } catch {}
  try {
    sessionStorage.setItem(key, token);
  } catch {}
  window.dispatchEvent(new Event(savedTicketEvent));
  return persistent;
}

export function readSavedTicket(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(key);
    if (valid(token)) return token;
  } catch {}
  try {
    const token = sessionStorage.getItem(key);
    if (valid(token)) return token;
  } catch {}
  return null;
}

export function forgetTicket(token?: string) {
  if (typeof window === "undefined") return;
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[name];
      if (!token || storage.getItem(key) === token) {
        storage.removeItem(key);
        if (name === "sessionStorage") {
          storage.removeItem("makkah_email_sent");
          storage.removeItem("makkah_registration_email");
        }
      }
    } catch {}
  }
  window.dispatchEvent(new Event(savedTicketEvent));
}
