"use client";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
type User = { display_name: string; role: "ADMIN" | "STAFF"; gate: number | null };
export function WorkspaceHeader({ user }: { user: User }) {
  const [error, setError] = useState("");
  return (
    <header className="workspace-header">
      <div className="container workspace-bar">
        <Link href="/" aria-label="العودة للرئيسية">
          <img src="/images/college-logo.svg" alt="كلية مكة الأهلية" />
        </Link>
        <div className="workspace-user">
          {user.role === "ADMIN" && (
            <Link href="/check-in" className="text-link">
              بوابة الدخول
            </Link>
          )}
          <div>
            {user.display_name}
            <small>
              {user.role === "ADMIN"
                ? "إدارة الفعالية"
                : `البوابة ${user.gate} · فريق الاستقبال`}
            </small>
          </div>
          <button
            className="icon-button"
            aria-label="تسجيل الخروج"
            onClick={async () => {
              try {
                await api("/api/auth/logout", {});
                window.location.assign("/login");
              } catch {
                setError("تعذر تسجيل الخروج. حاول مجددًا.");
              }
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="container">
          {error}
        </p>
      )}
    </header>
  );
}
