"use client";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { ageGroups, ageLabels } from "@/lib/event";
import { appPath } from "@/lib/base-path";
export function RegistrationForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const response = await fetch(appPath("/api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, consent: data.consent === "on" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      sessionStorage.setItem("makkah_ticket", result.token);
      sessionStorage.setItem("makkah_email_sent", String(result.emailSent));
      window.location.assign(appPath("/registration/success"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الاتصال. حاول مجددًا.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="registration-form" onSubmit={submit}>
      <div className="form-heading">
        <span className="step-marker">1</span>
        <div>
          <h3>بياناتك، وبداية تجربتك</h3>
          <p>أكمل البيانات التالية لإصدار تذكرة دخولك.</p>
        </div>
        <span className="required-hint">* حقول مطلوبة</span>
      </div>
      <div className="form-grid">
        <label className="full">
          الاسم الكامل <em>*</em>
          <input
            name="full_name"
            autoComplete="name"
            placeholder="الاسم كما ترغب أن يظهر على تذكرتك"
            minLength={5}
            maxLength={150}
            required
          />
        </label>
        <label>
          البريد الإلكتروني <em>*</em>
          <input
            name="email"
            autoComplete="email"
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            maxLength={190}
            required
          />
        </label>
        <label>
          رقم الجوال <em>*</em>
          <input
            name="phone"
            autoComplete="tel"
            type="tel"
            dir="ltr"
            placeholder="05x xxx xxxx"
            pattern="05[0-9]{8}"
            minLength={10}
            maxLength={10}
            required
          />
        </label>
        <label>
          جهة العمل أو الدراسة <span className="optional">اختياري</span>
          <input
            name="company"
            autoComplete="organization"
            placeholder="اسم الجهة"
            maxLength={150}
          />
        </label>
        <label>
          المسمى الوظيفي <span className="optional">اختياري</span>
          <input
            name="job_title"
            autoComplete="organization-title"
            placeholder="مثل: طالب، متخصص سياحة"
            maxLength={100}
          />
        </label>
        <label className="full">
          الفئة العمرية <em>*</em>
          <select name="age_group" defaultValue="" required>
            <option value="" disabled>
              اختر الفئة العمرية
            </option>
            {ageGroups.map((g, i) => (
              <option key={g} value={g}>
                {ageLabels[i]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          أوافق على استخدام بياناتي لإدارة التسجيل والحضور وإرسال تذكرة
          الفعالية. لن تُستخدم لأغراض تسويقية.
        </span>
      </label>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <button className="button submit-button" type="submit" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="spin" size={20} />
            جارٍ إصدار تذكرتك…
          </>
        ) : (
          <>
            أكّد تسجيلي <ArrowLeft size={20} />
          </>
        )}
      </button>
      <p className="form-assurance">
        <ShieldCheck size={16} />
        بياناتك بأمان <span>·</span>
        <Check size={15} />
        تذكرة QR تصلك على بريدك
      </p>
    </form>
  );
}
