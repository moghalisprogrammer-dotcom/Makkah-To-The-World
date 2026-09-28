"use client";
import { useLocale } from "./locale-provider";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Printer,
  ArrowLeft,
  LoaderCircle,
  MailCheck,
  ExternalLink,
  ClipboardList,
  QrCode,
} from "lucide-react";
import { event } from "@/lib/event";
import { brand } from "@/lib/brand";
import {
  selectedWorkshop,
  workshopLabel,
  workshopTime,
  type WorkshopId,
} from "@/lib/workshops";
import { appPath } from "@/lib/base-path";
import {
  forgetTicket,
  readSavedTicket,
  rememberTicket,
} from "@/lib/saved-ticket";
interface TicketData {
  full_name: string;
  registration_number: string;
  status: string;
  qr: string;
  workshop_id: WorkshopId | null;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  age_group?: string;
}
export function TicketView({
  token,
  success = false,
}: {
  token?: string;
  success?: boolean;
}) {
  const { t, locale } = useLocale();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [savedOnDevice, setSavedOnDevice] = useState(false);
  const activeToken = useRef<string | null>(null);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [stage, setStage] = useState<"ticket" | "workshop">("ticket");
  const followupHeading = useRef<HTMLHeadingElement>(null);
  const selected = selectedWorkshop(ticket?.workshop_id);
  const hasWorkshop = Boolean(selected && ticket?.status !== "CANCELLED");
  useEffect(() => {
    if (stage === "workshop") followupHeading.current?.focus();
  }, [stage]);
  useEffect(() => {
    const key =
      token ||
      new URLSearchParams(location.search).get("ticket") ||
      readSavedTicket();
    activeToken.current = key;
    if (!key) {
      setError(
        t(
          "لم يتم العثور على تذكرة. افتح الرابط المرسل إلى بريدك أو أكمل التسجيل أولًا.",
        ),
      );
      return;
    }
    if (success) {
      try {
        const sent = sessionStorage.getItem("makkah_email_sent");
        setEmailSent(sent === null ? null : sent === "true");
        setRegistrationEmail(
          sessionStorage.getItem("makkah_registration_email") || "",
        );
      } catch {}
    }
    const controller = new AbortController();
    fetch(appPath(`/api/ticket/${key}`), {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          if (r.status === 404) forgetTicket(key);
          throw new Error(data.error);
        }
        setTicket(data);
        setSavedOnDevice(rememberTicket(key));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [token, success]);
  async function download() {
    if (!ticket) return;
    setError("");
    setDownloading(true);
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1510;
      const ctx = canvas.getContext("2d")!;
      const ticketFont =
        locale === "en"
          ? '"Poppins", "IBM Plex Sans Arabic"'
          : '"Brand Numerals", "IBM Plex Sans Arabic"';
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1000, 1510);
      ctx.fillStyle = "#041B3D";
      ctx.fillRect(0, 0, 1000, 280);
      const seal = new Image();
      seal.src = appPath("/images/college-seal.webp");
      await seal.decode();
      ctx.drawImage(seal, 875, 28, 82, 82);
      ctx.textAlign = "center";
      ctx.direction = locale === "ar" ? "rtl" : "ltr";
      ctx.font = `500 25px ${ticketFont}`;
      ctx.fillStyle = "#2C97D2";
      ctx.fillText(t("من مكة إلى العالم"), 500, 75);
      ctx.fillStyle = "#ffffff";
      ctx.font = `600 43px ${ticketFont}`;
      ctx.fillText(t("يوم السياحة العالمي 2026"), 500, 155, 900);
      ctx.font = `400 25px ${ticketFont}`;
      ctx.fillText(t(event.companion), 500, 217, 900);
      ctx.fillStyle = "#041B3D";
      let fontSize = 39;
      do {
        ctx.font = `600 ${fontSize--}px ${ticketFont}`;
      } while (ctx.measureText(ticket.full_name).width > 900 && fontSize > 15);
      ctx.fillText(ticket.full_name, 500, 365);
      ctx.direction = "ltr";
      ctx.font = "400 26px Poppins";
      ctx.fillStyle = "#0082BF";
      ctx.fillText(ticket.registration_number, 500, 415);
      const qr = new Image();
      qr.src = ticket.qr;
      await qr.decode();
      ctx.drawImage(qr, 280, 455, 440, 440);
      ctx.direction = locale === "ar" ? "rtl" : "ltr";
      ctx.font = `400 23px ${ticketFont}`;
      ctx.fillStyle = "#697e96";
      ctx.fillText(t("يرجى إبراز رمز QR عند الدخول"), 500, 935);
      ctx.fillStyle = "#041B3D";
      ctx.font = `500 31px ${ticketFont}`;
      ctx.fillText(t(event.date), 500, 1035);
      ctx.font = `400 27px ${ticketFont}`;
      ctx.fillText(t(event.time), 500, 1095);
      ctx.fillText(t(event.location), 500, 1150, 920);
      ctx.font = `500 25px ${ticketFont}`;
      ctx.fillText(workshopLabel(ticket.workshop_id, locale), 500, 1230, 920);
      ctx.font = `400 23px ${ticketFont}`;
      ctx.fillText(workshopTime(ticket.workshop_id, locale), 500, 1275);
      if (selected) {
        ctx.font = `400 19px ${ticketFont}`;
        ctx.fillText(
          t("تسجيل الفعالية وحده لا يؤكد المشاركة في الورشة."),
          500,
          1310,
          920,
        );
      }
      ctx.fillStyle = "#eaf0f6";
      ctx.fillRect(0, 1330, 1000, 180);
      ctx.fillStyle = "#58708d";
      ctx.font = `400 22px ${ticketFont}`;
      ctx.fillText(t(event.organizer), 500, 1380, 920);
      ctx.font = `400 19px ${ticketFont}`;
      ctx.fillText(
        `${t(brand.kaizenName)} — ${t(brand.kaizenRole)}`,
        500,
        1425,
      );
      ctx.direction = "ltr";
      ctx.font = "400 21px Poppins";
      ctx.fillText(event.email, 500, 1470);
      const link = document.createElement("a");
      link.download = `${ticket.registration_number}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadRequested(true);
    } catch {
      setError(
        t("تعذر تنزيل الصورة. يمكنك استخدام زر الطباعة لحفظ التذكرة PDF."),
      );
    } finally {
      setDownloading(false);
    }
  }
  if (!ticket && !error)
    return (
      <div className="loading-block">
        <LoaderCircle className="spin" />
        {t("جارٍ تجهيز تذكرتك…")}
      </div>
    );
  return (
    <div className="ticket-page">
      {ticket && (
        <>
          <div className="ticket-success-icon">
            <Check size={29} />
          </div>
          <h1>
            {success ? t("تم تسجيلك، أهلًا بك!") : t("تذكرتك إلى تجربة مُلهمة")}
          </h1>
          <p>
            {t("يسعدنا انضمامك إلينا في فعالية يوم السياحة العالمي 2026!")}
            <br />
            {t("يرجى الاحتفاظ برمز الاستجابة السريعة لإبرازه عند الدخول.")}
          </p>
          {hasWorkshop && (
            <nav
              className="ticket-step-nav"
              aria-label={t("خطوات تأكيد الحضور")}
            >
              <button
                type="button"
                aria-pressed={stage === "ticket"}
                onClick={() => setStage("ticket")}
              >
                <QrCode size={18} />
                {t("رمز الدخول")}
              </button>
              <button
                type="button"
                aria-pressed={stage === "workshop"}
                onClick={() => setStage("workshop")}
              >
                <ClipboardList size={18} />
                {t("تسجيل الورشة")}
              </button>
            </nav>
          )}
          {success && emailSent && stage === "ticket" && (
            <section
              className="ticket-delivery"
              aria-label={t("تأكيد إرسال البريد")}
            >
              <span className="ticket-delivery-icon">
                <MailCheck size={22} />
              </span>
              <div>
                <h2>{t("أُرسلت تذكرتك ورمز QR إلى بريدك الإلكتروني")}</h2>
                <p>
                  {t(
                    "راجع بريدك لتجد معلومات الدخول، الموقع، البرنامج والورش.",
                  )}
                  {registrationEmail && (
                    <strong dir="ltr">{registrationEmail}</strong>
                  )}
                </p>
              </div>
              <a
                className="ticket-gmail"
                href="https://mail.google.com/mail/u/0/#inbox"
                target="_blank"
                rel="noreferrer"
              >
                {t("فتح Gmail")}
                <ExternalLink size={15} />
              </a>
            </section>
          )}
          {success && emailSent === false && stage === "ticket" && (
            <div className="notice warning">
              {t(
                "تسجيلك مؤكد وتذكرتك محفوظة. تعذر إرسال البريد حاليًا؛ احفظ تذكرتك من هنا، أو تواصل مع فريق التنظيم.",
              )}
            </div>
          )}
          {ticket.status === "CANCELLED" ? (
            <div className="notice error">
              {t("هذا التسجيل ملغي، ولا يتيح الدخول إلى الفعالية.")}
            </div>
          ) : (
            <>
              <div
                className="ticket-pass-panel"
                data-active={stage === "ticket"}
              >
                <article className="ticket">
                  <div className="ticket-head">
                    <img
                      src={appPath("/images/college-seal.webp")}
                      alt={t("كلية مكة الأهلية")}
                    />
                    <div>
                      <p>{t("بطاقة حضور · ADMISSION PASS")}</p>
                      <h2>{t("يوم السياحة العالمي 2026")}</h2>
                      <small>{t(event.companion)}</small>
                    </div>
                  </div>
                  <div className="ticket-body">
                    <h3>{ticket.full_name}</h3>
                    <div className="ticket-number" dir="ltr">
                      {ticket.registration_number}
                    </div>
                    <img
                      className="ticket-qr"
                      src={ticket.qr}
                      alt={t("رمز الاستجابة السريعة الخاص بتذكرة الدخول")}
                    />
                    <p>{t("تذكرتك شخصية · احتفظ بها حتى موعد الفعالية")}</p>
                  </div>
                  <div className="ticket-meta">
                    <div>
                      <span>{t("التاريخ")}</span>
                      <strong>{t(event.date)}</strong>
                    </div>
                    <div>
                      <span>{t("الوقت")}</span>
                      <strong>{t(event.time)}</strong>
                    </div>
                    <div className="full">
                      <span>{t("الموقع")}</span>
                      <strong>
                        <a href={event.maps} target="_blank" rel="noreferrer">
                          {t(event.location)} ↗
                        </a>
                      </strong>
                    </div>
                    <div className="full ticket-workshop">
                      <span>{t("اختيارك للورش")}</span>
                      <strong>
                        {workshopLabel(ticket.workshop_id, locale)}
                      </strong>
                      {ticket.workshop_id && (
                        <span>{workshopTime(ticket.workshop_id, locale)}</span>
                      )}
                    </div>
                  </div>
                  <div className="ticket-sponsor-line">
                    {t(brand.kaizenName)} — {t(brand.kaizenRole)}
                  </div>
                </article>
                <div className="ticket-save-reminder">
                  <QrCode size={21} aria-hidden="true" />
                  <div>
                    <strong>{t("احفظ رمز الدخول أولًا")}</strong>
                    <span>
                      {t(
                        hasWorkshop
                          ? "ستحتاجه عند بوابة الدخول، حتى بعد تعبئة نموذج الورشة."
                          : "يرجى الاحتفاظ برمز الاستجابة السريعة لإبرازه عند الدخول.",
                      )}
                    </span>
                  </div>
                </div>
                <div className="ticket-actions">
                  <button
                    className={`button ticket-save-button ${!downloadRequested && !downloading ? "needs-attention" : ""}`}
                    onClick={download}
                    disabled={downloading}
                  >
                    <Download size={18} />
                    {downloading
                      ? t("جارٍ الحفظ…")
                      : t(
                          downloadRequested
                            ? "حفظ الرمز مرة أخرى"
                            : "حفظ رمز الدخول على جهازي",
                        )}
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => window.print()}
                  >
                    <Printer size={18} />
                    {t("طباعة / حفظ PDF")}
                  </button>
                </div>
                {downloadRequested && (
                  <p className="ticket-download-status" role="status">
                    {t("تم طلب التنزيل؛ تأكد من حفظ الصورة على جهازك.")}
                  </p>
                )}
                {hasWorkshop && (
                  <button
                    type="button"
                    className="button ticket-workshop-next"
                    onClick={() => setStage("workshop")}
                  >
                    {t("التالي: تأكيد المشاركة في الورشة")}
                    <ArrowLeft size={18} />
                  </button>
                )}
              </div>
              {ticket.email && stage === "ticket" && (
                <details className="ticket-personal-details">
                  <summary>{t("بيانات تسجيلك")}</summary>
                  <dl>
                    {[
                      [t("البريد الإلكتروني"), ticket.email],
                      [t("الجوال"), ticket.phone],
                      [t("جهة العمل أو الدراسة"), ticket.company],
                      [t("المسمى الوظيفي"), ticket.job_title],
                      [t("الفئة العمرية"), ticket.age_group],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>
                            <bdi>{value}</bdi>
                          </dd>
                        </div>
                      ))}
                  </dl>
                </details>
              )}
              {hasWorkshop && selected && stage === "workshop" && (
                <section
                  className="ticket-workshop-followup"
                  aria-labelledby="workshop-followup-title"
                >
                  <span className="workshop-required">
                    <ClipboardList size={17} />
                    {t("خطوة مطلوبة لتأكيد الورشة")}
                  </span>
                  <h2
                    id="workshop-followup-title"
                    ref={followupHeading}
                    tabIndex={-1}
                  >
                    {t("أكمل تسجيلك في الورشة")}
                  </h2>
                  <p>
                    {t(
                      "حضورك للفعالية مؤكد. لتأكيد مشاركتك في الورشة التالية، يجب تعبئة نموذجها وإرساله.",
                    )}
                  </p>
                  <div className="workshop-selected-summary">
                    <h3>{workshopLabel(ticket.workshop_id, locale)}</h3>
                    <span>
                      {workshopTime(ticket.workshop_id, locale)} ·{" "}
                      {t(selected.location)}
                    </span>
                  </div>
                  <div className="workshop-qr-reminder">
                    <img
                      src={ticket.qr}
                      alt={t("رمز الاستجابة السريعة الخاص بتذكرة الدخول")}
                    />
                    <div>
                      <strong>{t("احفظ رمز الدخول أولًا")}</strong>
                      <p>{t("قبل فتح النموذج، احتفظ بنسخة من رمز الدخول.")}</p>
                      <button
                        type="button"
                        className={`button ticket-save-button ${!downloadRequested && !downloading ? "needs-attention" : ""}`}
                        onClick={download}
                        disabled={downloading}
                      >
                        <Download size={17} />
                        {downloading
                          ? t("جارٍ الحفظ…")
                          : t(
                              downloadRequested
                                ? "حفظ الرمز مرة أخرى"
                                : "حفظ رمز الدخول على جهازي",
                            )}
                      </button>
                    </div>
                  </div>
                  {downloadRequested && (
                    <p className="ticket-download-status" role="status">
                      {t("تم طلب التنزيل؛ تأكد من حفظ الصورة على جهازك.")}
                    </p>
                  )}
                  <a
                    className="button workshop-form-link"
                    href={selected.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby="workshop-form-instructions"
                  >
                    {t("فتح نموذج الورشة وتعبئته")}
                    <ExternalLink size={19} />
                  </a>
                  <p
                    id="workshop-form-instructions"
                    className="workshop-form-instructions"
                  >
                    {t(
                      "يفتح نموذج Google في نافذة جديدة. أكمل البيانات واضغط «إرسال» داخل النموذج.",
                    )}
                  </p>
                  <p className="workshop-form-required-note">
                    {t("تسجيل الفعالية وحده لا يؤكد المشاركة في الورشة.")}
                  </p>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setStage("ticket")}
                  >
                    <QrCode size={16} />
                    {t("عرض تذكرة الدخول")}
                  </button>
                </section>
              )}
            </>
          )}
          <p className="ticket-note">
            {t("خطّط لزيارتك:")}{" "}
            <a href={appPath("/#agenda")}>
              {t("استعرض البرنامج وورش العمل")}
              <ArrowLeft size={12} />
            </a>
            {t("، و")}
            <a href={appPath("/#venue-guide")}>
              {t("دليل الوصول داخل الكلية")}
            </a>
            .
          </p>
        </>
      )}
      {error && (
        <div className="notice error" role="alert">
          {t(error)}
        </div>
      )}
      {ticket && savedOnDevice && (
        <aside className="ticket-device-note">
          <p>
            {t(
              "تذكرتك محفوظة في هذا المتصفح. عند عودتك للموقع، افتح «تذكرتي ورمز الدخول».",
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              forgetTicket(activeToken.current || undefined);
              setSavedOnDevice(false);
            }}
          >
            {t("إزالة التذكرة من هذا الجهاز")}
          </button>
        </aside>
      )}
      <a className="text-link" style={{ color: "#0082BF" }} href={appPath("/")}>
        {t("العودة إلى صفحة الفعالية")}
        <ArrowLeft size={15} />
      </a>
    </div>
  );
}
