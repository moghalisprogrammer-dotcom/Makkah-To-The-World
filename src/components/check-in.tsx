"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ScanLine,
  Search,
  Check,
  CircleAlert,
  ArrowLeft,
  LoaderCircle,
  CameraOff,
} from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, statusLabels, ageGroups, ageLabels } from "@/lib/event";
import { workshopLabel, workshopTime, type WorkshopId } from "@/lib/workshops";
interface Entry {
  id: number;
  full_name: string;
  company: string;
  email: string;
  phone: string;
  job_title: string;
  age_group: string;
  created_at: string;
  locale: "ar" | "en";
  registration_number: string;
  status: string;
  checked_in_at: string | null;
  staff_name: string | null;
  workshop_id: WorkshopId | null;
}
export function CheckIn({ gate }: { gate: number | null }) {
  const [tab, setTab] = useState<"camera" | "search">("camera");
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [success, setSuccess] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[] | null>(null);
  const [manualToken, setManualToken] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<{ stop: () => void } | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const handling = useRef(false);
  const stop = useCallback(() => {
    running.current = false;
    if (fallbackTimer.current !== null) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = null;
    scanner.current?.stop();
    scanner.current = null;
    const stream = video.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (mounted.current) setCamera(false);
  }, []);
  useEffect(() => {
    mounted.current = true;
    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      mounted.current = false;
      stop();
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [stop]);
  async function verify(value: string) {
    stop();
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      let token = value.trim();
      if (token.startsWith("http")) {
        const url = new URL(token);
        if (url.origin !== window.location.origin)
          throw new Error("الرابط لا يتبع هذه الفعالية.");
        token = url.pathname.split("/").pop() || "";
      }
      const data = await api<{ registration: Entry }>("/api/check-in", {
        action: "VERIFY",
        token,
      });
      setEntry(data.registration);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setError("");
    setBusy(true);
    handling.current = false;
    running.current = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "الكاميرا تحتاج اتصال HTTPS أو localhost. يمكنك استخدام البحث اليدوي.",
        );
      const [{ BrowserQRCodeReader }, { default: decodeFrame }] =
        await Promise.all([import("@zxing/browser"), import("jsqr")]);
      if (!running.current) return;
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        video.current!,
        (result) => {
          if (result && !handling.current && running.current) {
            handling.current = true;
            void verify(result.getText());
          }
        },
      );
      if (!running.current || !mounted.current) {
        controls.stop();
        return;
      }
      scanner.current = controls;
      setCamera(true);
      // Some valid QR patterns evade ZXing's finder. An independent decoder
      // reads the same camera pixels; both paths still require server verification.
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const scanFallback = () => {
        if (!running.current || !mounted.current || handling.current) return;
        const source = video.current;
        if (context && source && source.readyState >= 2 && source.videoWidth) {
          const scale = Math.min(1, 960 / source.videoWidth);
          const width = Math.round(source.videoWidth * scale);
          const height = Math.round(source.videoHeight * scale);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          try {
            context.drawImage(source, 0, 0, width, height);
            const image = context.getImageData(0, 0, width, height);
            const result = decodeFrame(image.data, width, height, {
              inversionAttempts: "attemptBoth",
            });
            if (result?.data && running.current && !handling.current) {
              handling.current = true;
              void verify(result.data);
              return;
            }
          } catch {
            // A camera frame may become unavailable while the stream is stopping.
          }
        }
        fallbackTimer.current = setTimeout(scanFallback, 250);
      };
      fallbackTimer.current = setTimeout(scanFallback, 250);
    } catch (err) {
      stop();
      setError(
        err instanceof Error && err.message.includes("HTTPS")
          ? err.message
          : "تعذر فتح الكاميرا. اسمح بالوصول إليها من إعدادات المتصفح، أو استخدم البحث اليدوي.",
      );
    } finally {
      if (mounted.current && !handling.current) setBusy(false);
    }
  }
  async function search() {
    if (query.trim().length < 2) {
      setError("أدخل حرفين على الأقل للبحث.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await api<{ registrations: Entry[] }>(
        `/api/check-in?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(data.registrations);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!entry) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ registration: Entry }>("/api/check-in", {
        action: "CHECK_IN",
        id: entry.id,
      });
      setEntry(result.registration);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
      try {
        const data = await api<{ registrations: Entry[] }>(
          `/api/check-in?q=${encodeURIComponent(entry.registration_number)}`,
        );
        if (data.registrations[0]) setEntry(data.registrations[0]);
      } catch {
        /* Keep the original failure visible. */
      }
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setEntry(null);
    setSuccess(false);
    setError("");
    setResults(null);
    setQuery("");
    setManualToken("");
    handling.current = false;
  }
  const duplicate = entry?.status === "CHECKED_IN" && !success;
  const cancelled = entry?.status === "CANCELLED";
  return (
    <div className="check-in-main">
      <div className="check-in-heading">
        <span
          className="section-label"
          style={{ justifyContent: "center", marginBottom: 9 }}
        >
          {gate ? `البوابة ${gate} · الاستقبال` : "الاستقبال · مدير الفعالية"}
        </span>
        <span className="check-in-ready" role="status">
          <i />{" "}
          {gate ? `البوابة ${gate} جاهزة لاستقبال الضيوف` : "نقطة التحقق جاهزة"}
        </span>
        <h1>أهلًا بكل ضيف</h1>
        <p>يوم السياحة العالمي 2026 · كلية مكة الأهلية</p>
      </div>
      <section
        className={`scanner-panel ${camera ? "is-scanning" : ""} ${entry ? "has-result" : ""}`}
      >
        {entry ? (
          <div
            className={`scan-result ${duplicate ? "duplicate" : cancelled ? "cancelled" : ""}`}
          >
            <div className="result-icon">
              {duplicate || cancelled ? (
                <CircleAlert size={33} />
              ) : (
                <Check size={34} />
              )}
            </div>
            <h2>
              {success
                ? "تم الدخول بنجاح"
                : duplicate
                  ? "سبق تسجيل الدخول"
                  : cancelled
                    ? "التسجيل ملغي"
                    : "تذكرة صالحة للدخول"}
            </h2>
            <p>
              {success
                ? "تم حفظ وقت الدخول واسم الموظف."
                : duplicate
                  ? "لا يمكن استخدام التذكرة للدخول مرة ثانية."
                  : cancelled
                    ? "هذه التذكرة لا تتيح الدخول."
                    : "تحقّق من بيانات الزائر، ثم أكّد دخوله."}
            </p>
            <h3>{entry.full_name}</h3>
            <span dir="ltr" className="ticket-number">
              {entry.registration_number}
            </span>
            <div className="result-details">
              <div>
                <span>البريد الإلكتروني</span>
                <strong dir="ltr">{entry.email}</strong>
              </div>
              <div>
                <span>الجوال</span>
                <strong dir="ltr">{entry.phone}</strong>
              </div>
              <div>
                <span>الجهة</span>
                <strong>{entry.company || "غير محددة"}</strong>
              </div>
              <div>
                <span>الحالة</span>
                <strong>{statusLabels[entry.status]}</strong>
              </div>
              <div>
                <span>المسمى الوظيفي</span>
                <strong>{entry.job_title || "غير محدد"}</strong>
              </div>
              <div>
                <span>الفئة العمرية</span>
                <strong>
                  {ageLabels[
                    ageGroups.indexOf(
                      entry.age_group as (typeof ageGroups)[number],
                    )
                  ] || entry.age_group}
                </strong>
              </div>
              <div>
                <span>تاريخ التسجيل</span>
                <strong>{formatDate(entry.created_at)}</strong>
              </div>
              <div>
                <span>لغة التذكرة</span>
                <strong>{entry.locale === "en" ? "English" : "العربية"}</strong>
              </div>
              <div>
                <span>الورشة المختارة</span>
                <strong>{workshopLabel(entry.workshop_id)}</strong>
                {entry.workshop_id && (
                  <span>{workshopTime(entry.workshop_id)}</span>
                )}
              </div>
              {entry.checked_in_at && (
                <>
                  <div>
                    <span>وقت الدخول</span>
                    <strong>{formatDate(entry.checked_in_at)}</strong>
                  </div>
                  <div>
                    <span>تم بواسطة</span>
                    <strong>{entry.staff_name}</strong>
                  </div>
                </>
              )}
            </div>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            {!success && !duplicate && !cancelled && (
              <button className="button" onClick={confirm} disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={20} />
                ) : (
                  <Check size={20} />
                )}
                تأكيد الدخول
              </button>
            )}
            <button
              className="button button-outline"
              onClick={reset}
              disabled={busy}
            >
              {success ? "استقبال الزائر التالي" : "العودة إلى التحقق"}
              <ArrowLeft size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="scanner-tabs">
              <button
                className={tab === "camera" ? "active" : ""}
                onClick={() => {
                  setTab("camera");
                  setError("");
                }}
              >
                <ScanLine size={18} />
                مسح رمز QR
              </button>
              <button
                className={tab === "search" ? "active" : ""}
                onClick={() => {
                  stop();
                  setTab("search");
                  setError("");
                }}
              >
                <Search size={18} />
                البحث اليدوي
              </button>
            </div>
            {tab === "camera" ? (
              <>
                <div className={`scanner-window ${camera ? "is-live" : ""}`}>
                  <video
                    ref={video}
                    muted
                    playsInline
                    style={{ display: camera ? "block" : "none" }}
                  />
                  {!camera && (
                    <>
                      <ScanLine />
                      <p>ضع رمز التذكرة داخل الإطار</p>
                    </>
                  )}
                  <div className="scanner-frame" />
                </div>
                <button
                  className="button"
                  onClick={camera ? stop : start}
                  disabled={busy}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={19} />
                  ) : camera ? (
                    <CameraOff size={19} />
                  ) : (
                    <Camera size={19} />
                  )}{" "}
                  {camera ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
                </button>
                <p className="scan-help">
                  المسح للتحقق فقط. لا يُسجَّل الدخول إلا بعد التأكيد.
                </p>
                <details style={{ marginTop: 20 }}>
                  <summary
                    style={{
                      fontSize: 11,
                      color: "#6f87a0",
                      cursor: "pointer",
                    }}
                  >
                    إدخال رمز التذكرة أو رابطها يدويًا
                  </summary>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void verify(manualToken);
                    }}
                  >
                    <input
                      className="search-input"
                      style={{ marginTop: 14, padding: 12 }}
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      required
                      maxLength={256}
                      placeholder="رمز التذكرة أو رابطها"
                      aria-label="رمز التذكرة"
                      dir="ltr"
                    />
                    <button
                      className="button button-small"
                      style={{ marginTop: 10 }}
                      disabled={busy}
                    >
                      تحقق من التذكرة
                    </button>
                  </form>
                </details>
              </>
            ) : (
              <div className="manual-search">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void search();
                  }}
                >
                  <label className="field">
                    ابحث عن الزائر
                    <input
                      className="search-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      minLength={2}
                      maxLength={190}
                      required
                      placeholder="الاسم، الجوال، البريد أو رقم التسجيل"
                    />
                  </label>
                  <button
                    className="button"
                    style={{ width: "100%" }}
                    disabled={busy}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={18} />
                    ) : (
                      <Search size={18} />
                    )}
                    البحث عن التسجيل
                  </button>
                </form>
                <div className="search-results">
                  {results?.map((r) => (
                    <button
                      key={r.id}
                      className="search-result"
                      onClick={() => setEntry(r)}
                    >
                      <span>
                        <strong>{r.full_name}</strong>
                        <small dir="ltr">{r.registration_number}</small>
                        <em>{workshopLabel(r.workshop_id)}</em>
                      </span>
                      <span className={`status-pill ${r.status}`}>
                        {statusLabels[r.status]}
                      </span>
                    </button>
                  ))}
                  {results?.length === 0 && (
                    <div className="empty-state">
                      لم نعثر على تسجيل مطابق.
                      <br />
                      جرّب رقم التسجيل أو البريد الإلكتروني.
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
          </>
        )}
      </section>
      <p className="scan-help">تُحفظ عمليات الدخول مباشرة لدى فريق التنظيم.</p>
    </div>
  );
}
