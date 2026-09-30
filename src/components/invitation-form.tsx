"use client";
import { useLocale } from "./locale-provider";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { ageGroups, ageLabels } from "@/lib/event";
import { arabicTime, period, workshops } from "@/lib/agenda";
import { api } from "@/lib/client";
import { rememberTicket } from "@/lib/saved-ticket";
import type { WorkshopId } from "@/lib/workshops";

export const emptyInvitation = {
  full_name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  age_group: "",
  workshop_id: null as string | null,
  workshop_answered: false,
  consent: false,
  website: "",
};
type InvitationData = typeof emptyInvitation;
const finalStep = 6;
function westernDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) % 16),
  );
}
function saudiMobile(value: string) {
  return westernDigits(value).replace(/\D/g, "").slice(0, 10);
}

export function InvitationForm({
  onSuccess,
  data,
  setData,
  step,
  setStep,
  fixedWorkshopId,
}: {
  onSuccess: (token: string, sent: boolean) => void;
  data: InvitationData;
  setData: Dispatch<SetStateAction<InvitationData>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  fixedWorkshopId?: WorkshopId;
}) {
  const { t, locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(1);
  const form = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const mountedStep = useRef(step);
  useEffect(() => {
    if (mountedStep.current === step) return;
    mountedStep.current = step;
    // Announce the question without opening the phone keyboard automatically.
    const timer = window.setTimeout(
      () => {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          form.current?.contains(active) &&
          active.matches("input,select,textarea,button")
        )
          return;
        form.current
          ?.querySelector<HTMLElement>("h3")
          ?.focus({ preventScroll: true });
      },
      reducedMotion ? 0 : 350,
    );
    return () => window.clearTimeout(timer);
  }, [step, reducedMotion]);
  function update<K extends keyof InvitationData>(
    field: K,
    value: InvitationData[K],
  ) {
    setData((previous) => ({ ...previous, [field]: value }));
    setError("");
  }
  function go(next: number) {
    if (busy || submitting.current) return;
    setDirection(next > step ? 1 : -1);
    setError("");
    setStep(next);
  }
  function validation(question: number) {
    if (question === 0 && data.full_name.trim().length < 5)
      return t("اكتب اسمك الكامل كما ترغب أن يظهر في التذكرة.");
    if (question === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      return t("تأكد من البريد الإلكتروني، مثل name@example.com.");
    if (question === 2 && !/^05\d{8}$/.test(data.phone))
      return t("اكتب رقم جوال سعودي من 10 أرقام يبدأ بـ 05.");
    if (
      question === 3 &&
      !(ageGroups as readonly string[]).includes(data.age_group)
    )
      return t("اختر الفئة العمرية المناسبة لك.");
    if (
      question === 4 &&
      (!data.workshop_answered ||
        (data.workshop_id !== null &&
          !workshops.some((workshop) => workshop.id === data.workshop_id)))
    )
      return t("اختر ورشة واحدة، أو اختر الاكتفاء بحضور الفعالية.");
    if (question === finalStep && !data.consent)
      return t(
        "نحتاج موافقتك على استخدام بياناتك لتنظيم الحضور وإرسال التذكرة.",
      );
    return "";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || busy) return;
    const message = validation(step);
    if (message) {
      setError(message);
      return;
    }
    if (step < finalStep) {
      go(step + 1);
      return;
    }
    for (let question = 0; question < finalStep; question++) {
      const issue = validation(question);
      if (issue) {
        go(question);
        setError(issue);
        return;
      }
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ token: string; emailSent: boolean }>(
        "/api/register",
        {
          full_name: data.full_name.trim(),
          email: data.email.trim(),
          phone: data.phone,
          company: data.company.trim(),
          job_title: data.job_title.trim(),
          age_group: data.age_group,
          workshop_id: fixedWorkshopId ?? data.workshop_id,
          consent: data.consent,
          website: data.website,
          locale,
        },
      );
      rememberTicket(result.token);
      try {
        sessionStorage.setItem("makkah_email_sent", String(result.emailSent));
        sessionStorage.setItem("makkah_registration_email", data.email.trim());
      } catch {
        /* The ticket still opens if the browser blocks session storage. */
      }
      onSuccess(result.token, result.emailSent);
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : t("تعذر تأكيد الحضور. حاول مجددًا."),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const chosenWorkshop = workshops.find(
    (workshop) => workshop.id === data.workshop_id,
  );
  const stageMotion = {
    enter: (travel: number) => ({
      opacity: reducedMotion ? 1 : 0,
      x: reducedMotion ? 0 : travel * -34,
      scale: reducedMotion ? 1 : 0.96,
      filter: reducedMotion ? "none" : "blur(5px)",
    }),
    visible: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    leave: (travel: number) => ({
      opacity: reducedMotion ? 1 : 0,
      x: reducedMotion ? 0 : travel * 28,
      scale: reducedMotion ? 1 : 1.025,
      filter: reducedMotion ? "none" : "blur(4px)",
    }),
  };
  return (
    <form
      className={`question-form ${error ? "has-error" : ""}`}
      ref={form}
      onSubmit={submit}
      noValidate
      aria-busy={busy}
    >
      <div className="question-stage-wrap">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            className={`question-stage question-stage-${step}`}
            variants={stageMotion}
            custom={direction}
            initial="enter"
            animate="visible"
            exit="leave"
            transition={{
              duration: reducedMotion ? 0 : 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {step === 0 && (
              <>
                <div className="question-heading">
                  <h3 tabIndex={-1}>{t("بأي اسم نرحّب بك؟")}</h3>
                  <p>{t("دعوتك تبدأ باسمك الكريم.")}</p>
                </div>
                <label className="question-field">
                  <span>{t("الاسم الكامل")}</span>
                  <input
                    name="full_name"
                    value={data.full_name}
                    onChange={(event) =>
                      update("full_name", event.target.value)
                    }
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder={t("اكتب اسمك الكامل")}
                    maxLength={150}
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "question-error" : undefined}
                  />
                </label>
                <div className="question-detail">
                  <TicketCheck size={19} />
                  <span>{t("سيظهر هذا الاسم على تذكرة دخولك.")}</span>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <div className="question-heading">
                  <h3 tabIndex={-1}>{t("أين نرسل دعوتك؟")}</h3>
                  <p>{t("ستصلك رسالة التأكيد ورمز الدخول QR.")}</p>
                </div>
                <label className="question-field">
                  <span>{t("البريد الإلكتروني")}</span>
                  <input
                    name="email"
                    type="email"
                    dir="ltr"
                    value={data.email}
                    onChange={(event) => update("email", event.target.value)}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="name@example.com"
                    maxLength={190}
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "question-error" : undefined}
                  />
                </label>
                <p className="question-hint">
                  {t("اختر بريدًا يمكنك الوصول إليه يوم الفعالية.")}
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <div className="question-heading">
                  <h3 tabIndex={-1}>{t("ما رقم جوالك؟")}</h3>
                  <p>{t("لاستكمال بيانات الحضور.")}</p>
                </div>
                <label className="question-field">
                  <span>{t("رقم الجوال")}</span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={data.phone}
                    onChange={(event) =>
                      update("phone", saudiMobile(event.target.value))
                    }
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="05xxxxxxxx"
                    minLength={10}
                    maxLength={10}
                    pattern="05[0-9]{8}"
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "question-error" : undefined}
                  />
                </label>
                <div className="question-detail">
                  <ShieldCheck size={19} />
                  <span>
                    {t(
                      "10 أرقام تبدأ بـ 05 · تُستخدم لتنظيم هذه الفعالية فقط.",
                    )}
                  </span>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div className="question-heading">
                  <h3 tabIndex={-1}>{t("ما فئتك العمرية؟")}</h3>
                  <p>{t("اختر الإجابة الأقرب لك.")}</p>
                </div>
                <fieldset
                  className="question-choices question-ages"
                  aria-label={t("الفئة العمرية")}
                >
                  {ageGroups.map((age, index) => (
                    <label
                      className={`question-choice ${data.age_group === age ? "is-selected" : ""}`}
                      key={age}
                    >
                      <input
                        type="radio"
                        name="age_group"
                        value={age}
                        checked={data.age_group === age}
                        onChange={() => update("age_group", age)}
                      />
                      <span className="question-radio" aria-hidden="true">
                        {data.age_group === age && <Check size={13} />}
                      </span>
                      <span>{t(ageLabels[index])}</span>
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            {step === 4 && (
              <>
                <div className="question-heading">
                  <h3 tabIndex={-1}>{t(fixedWorkshopId ? "ورشة العمل" : "هل ترغب بحضور ورشة؟")}</h3>
                  {!fixedWorkshopId && <p>{t("اختر ورشة واحدة؛ مواعيدها متداخلة.")}</p>}
                  <p>
                    {t(
                      "بعد تأكيد حضور الفعالية، يلزم تعبئة نموذج الورشة المختارة وإرساله.",
                    )}
                  </p>
                </div>
                <fieldset
                  className="question-choices question-workshops"
                  aria-label={t("اختيار ورشة العمل")}
                >
                  {workshops.filter((workshop) => !fixedWorkshopId || workshop.id === fixedWorkshopId).map((workshop) => {
                    const selected =
                      data.workshop_answered &&
                      data.workshop_id === workshop.id;
                    return (
                      <label
                        className={`question-choice ${selected ? "is-selected" : ""}`}
                        key={workshop.id}
                      >
                        <input
                          type="radio"
                          name="workshop_id"
                          value={workshop.id}
                          checked={selected}
                          onChange={() => {
                            setData((previous) => ({
                              ...previous,
                              workshop_id: workshop.id,
                              workshop_answered: true,
                            }));
                            setError("");
                          }}
                        />
                        <span className="question-radio" aria-hidden="true">
                          {selected && <Check size={13} />}
                        </span>
                        <span className="question-workshop-name">
                          {t(workshop.title)}
                        </span>
                        <small>
                          <b>{arabicTime(workshop.start)}</b>
                          {t(period(workshop.start))}
                        </small>
                      </label>
                    );
                  })}
                  {!fixedWorkshopId && <label
                    className={`question-choice question-no-workshop ${data.workshop_answered && data.workshop_id === null ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="workshop_id"
                      value="none"
                      checked={
                        data.workshop_answered && data.workshop_id === null
                      }
                      onChange={() => {
                        setData((previous) => ({
                          ...previous,
                          workshop_id: null,
                          workshop_answered: true,
                        }));
                        setError("");
                      }}
                    />
                    <span className="question-radio" aria-hidden="true">
                      {data.workshop_answered && data.workshop_id === null && (
                        <Check size={13} />
                      )}
                    </span>
                    <span>{t("أكتفي بحضور الفعالية")}</span>
                  </label>}
                </fieldset>
              </>
            )}
            {step === 5 && (
              <>
                <div className="question-heading">
                  <h3 tabIndex={-1}>{t("عرّفنا بمجالك.")}</h3>
                  <p>{t("معلومتان اختياريتان، ويمكنك التخطي.")}</p>
                </div>
                <div className="question-optional">
                  <label className="question-field">
                    <span>
                      {t("جهة العمل أو الدراسة")}
                      <small>{t("اختياري")}</small>
                    </span>
                    <input
                      name="company"
                      value={data.company}
                      onChange={(event) =>
                        update("company", event.target.value)
                      }
                      autoComplete="organization"
                      placeholder={t("اسم الجهة")}
                      maxLength={150}
                      enterKeyHint="next"
                    />
                  </label>
                  <label className="question-field">
                    <span>
                      {t("المسمى الوظيفي")}
                      <small>{t("اختياري")}</small>
                    </span>
                    <input
                      name="job_title"
                      value={data.job_title}
                      onChange={(event) =>
                        update("job_title", event.target.value)
                      }
                      autoComplete="organization-title"
                      placeholder={t("المسمى الوظيفي أو التخصص")}
                      maxLength={100}
                      enterKeyHint="next"
                    />
                  </label>
                </div>
              </>
            )}
            {step === finalStep && (
              <>
                <div className="question-heading question-review-heading">
                  <h3 tabIndex={-1}>{t("دعوتك بانتظار تأكيدك.")}</h3>
                  <p>{t("راجع بياناتك، ثم نجهّز تذكرتك.")}</p>
                </div>
                <div className="question-review">
                  <button
                    type="button"
                    onClick={() => go(0)}
                    disabled={busy}
                    aria-label={t("تعديل الاسم")}
                  >
                    <span>
                      <small>{t("الاسم الكامل")}</small>
                      <b>{data.full_name}</b>
                    </span>
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={busy}
                    aria-label={t("تعديل البريد الإلكتروني")}
                  >
                    <span>
                      <small>{t("البريد الإلكتروني")}</small>
                      <b dir="ltr">{data.email}</b>
                    </span>
                    <Pencil size={13} />
                  </button>
                  <div className="question-review-pair">
                    <button
                      type="button"
                      onClick={() => go(2)}
                      disabled={busy}
                      aria-label={t("تعديل رقم الجوال")}
                    >
                      <span>
                        <small>{t("الجوال")}</small>
                        <b dir="ltr">{data.phone}</b>
                      </span>
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(3)}
                      disabled={busy}
                      aria-label={t("تعديل الفئة العمرية")}
                    >
                      <span>
                        <small>{t("العمر")}</small>
                        <b>
                          {t(
                            ageLabels[
                              ageGroups.indexOf(
                                data.age_group as (typeof ageGroups)[number],
                              )
                            ],
                          )}
                        </b>
                      </span>
                      <Pencil size={13} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => go(4)}
                    disabled={busy}
                    aria-label={t("تعديل اختيار الورشة")}
                  >
                    <span>
                      <small>{t("ورشة العمل")}</small>
                      <b>{t(chosenWorkshop?.title || "حضور الفعالية فقط")}</b>
                    </span>
                    <Pencil size={13} />
                  </button>
                </div>
                <label className="question-consent">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={data.consent}
                    onChange={(event) =>
                      update("consent", event.target.checked)
                    }
                    disabled={busy}
                  />
                  <span>
                    {t(
                      "أوافق على استخدام بياناتي لتنظيم الحضور وإرسال تذكرة الفعالية.",
                    )}
                  </span>
                </label>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {error && (
        <div className="question-error" id="question-error" role="alert">
          {t(error)}
        </div>
      )}
      <div className="question-actions">
        {step > 0 && (
          <motion.button
            className="question-back"
            type="button"
            whileTap={reducedMotion ? undefined : { scale: 0.92 }}
            onClick={() => go(step - 1)}
            disabled={busy}
            aria-label={t("السؤال السابق")}
          >
            <ArrowRight size={18} />
            <span>{t("السابق")}</span>
          </motion.button>
        )}
        <motion.button
          className="question-next"
          type="submit"
          disabled={busy}
          whileHover={reducedMotion ? undefined : { scale: 1.015 }}
          whileTap={reducedMotion ? undefined : { scale: 0.96 }}
        >
          <span>
            {busy
              ? t("نجهّز دعوتك…")
              : step === finalStep
                ? t("أؤكد حضوري")
                : step === 5 && !data.company && !data.job_title
                  ? data.company.trim() || data.job_title.trim()
                    ? t("مراجعة الدعوة")
                    : t("تخطي ومراجعة الدعوة")
                  : t("متابعة")}
          </span>
          {busy ? (
            <LoaderCircle className="question-spin" size={19} />
          ) : step === finalStep ? (
            <TicketCheck size={20} />
          ) : (
            <ArrowLeft size={19} />
          )}
        </motion.button>
      </div>
      <div className="question-trust">
        <ShieldCheck size={13} />
        <span>{t("تسجيل مجاني · تذكرة دخول شخصية")}</span>
      </div>
      <div className="question-honeypot" aria-hidden="true">
        <input
          name="website"
          value={data.website}
          onChange={(event) => update("website", event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    </form>
  );
}
