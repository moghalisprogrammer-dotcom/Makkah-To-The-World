import type { Metadata } from "next";
import { Header } from "@/components/header";
import { LoginForm } from "@/components/login-form";
export const metadata: Metadata = { title: "معاينة دخول فريق التنظيم", robots: { index: false, follow: false } };
export default function Login() {
  return (
    <>
      <Header simple />
      <main className="light-page">
        <div className="auth-card">
          <img src="/images/college-seal.png" alt="شعار كلية مكة الأهلية" />
          <h1>أهلًا بفريق التنظيم</h1>
          <p>
            يوم السياحة العالمي 2026
            <br />
            دخول الإدارة وموظفي بوابات الاستقبال
          </p>
          <LoginForm />
          <div className="notice info">واجهة استعراض فقط · تفعيل الحسابات بعد ربط الخادم.</div>
          <div className="auth-footnote">حسابات مخصصة لفريق تنظيم الفعالية</div>
        </div>
      </main>
    </>
  );
}
