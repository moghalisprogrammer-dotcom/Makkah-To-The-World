"use client";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";
import { appPath } from "@/lib/base-path";
export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch(appPath("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      window.location.assign(appPath(result.redirect));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الاتصال.");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="field">
        اسم المستخدم
        <input
          name="username"
          required
          autoComplete="username"
          dir="ltr"
          maxLength={64}
          placeholder="اسم المستخدم الخاص بك"
        />
      </label>
      <label className="field">
        كلمة المرور
        <input
          name="password"
          required
          type="password"
          autoComplete="current-password"
          dir="ltr"
          maxLength={200}
          placeholder="••••••••••••"
        />
      </label>
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      <button className="button" disabled={busy}>
        {busy ? (
          <LoaderCircle size={19} className="spin" />
        ) : (
          <LockKeyhole size={18} />
        )}
        تسجيل الدخول <ArrowLeft size={19} />
      </button>
    </form>
  );
}
