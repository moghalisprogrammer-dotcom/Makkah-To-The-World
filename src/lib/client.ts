import QRCode from "qrcode";

type DemoRegistration = {
  token: string;
  full_name: string;
  email: string;
  workshop_id: string | null;
  registration_number: string;
};

export async function api<T = Record<string, unknown>>(
  url: string,
  data?: unknown,
): Promise<T> {
  // UI-only preview: the sample RSVP and ticket live in this browser session.
  if (url === "/api/register" && data && typeof data === "object") {
    const form = data as Partial<DemoRegistration>;
    const registration: DemoRegistration = {
      token: `DEMO-${crypto.randomUUID()}`,
      full_name: String(form.full_name || "ضيف تجريبي"),
      email: String(form.email || ""),
      workshop_id: form.workshop_id ? String(form.workshop_id) : null,
      registration_number: `DEMO-${Date.now().toString().slice(-6)}`,
    };
    sessionStorage.setItem("makkah_demo_registration", JSON.stringify(registration));
    return { token: registration.token, emailSent: false } as T;
  }

  if (url.startsWith("/api/ticket/")) {
    const key = decodeURIComponent(url.slice("/api/ticket/".length));
    const saved = sessionStorage.getItem("makkah_demo_registration");
    const registration = saved ? (JSON.parse(saved) as DemoRegistration) : null;
    if (!registration || registration.token !== key)
      throw new Error("لم نعثر على تذكرة العرض في جلسة هذا المتصفح.");
    const qr = await QRCode.toDataURL(
      `MAKKAH-TO-THE-WORLD-DEMO:${registration.registration_number}`,
      {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
        color: { dark: "#041b3d", light: "#ffffff" },
      },
    );
    return {
      full_name: registration.full_name,
      registration_number: registration.registration_number,
      status: "REGISTERED",
      qr,
      workshop_id: registration.workshop_id,
    } as T;
  }

  const response = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("انتهت الجلسة. يرجى تسجيل الدخول.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "تعذر إتمام العملية.");
  return result;
}
