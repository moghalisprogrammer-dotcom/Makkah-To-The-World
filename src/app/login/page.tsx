import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Header } from "@/components/header";
import { LoginForm } from "@/components/login-form";
import { appPath } from "@/lib/base-path";
export const metadata: Metadata = {
  title: "دخول فريق التنظيم",
  robots: { index: false, follow: false },
};
export default async function Login() {
  const user = await currentUser();
  if (user) redirect(appPath(user.role === "ADMIN" ? "/admin" : "/check-in"));
  return (
    <>
      <Header simple />
      <main className="light-page">
        <div className="auth-card">
          <img src={appPath("/images/college-seal.webp")} alt="شعار كلية مكة الأهلية" />
          <h1>أهلًا بفريق التنظيم</h1>
          <p>
            يوم السياحة العالمي 2026
            <br />
            دخول الإدارة وموظفي بوابات الاستقبال
          </p>
          <LoginForm />
          <div className="auth-footnote">حسابات مخصصة لفريق تنظيم الفعالية</div>
        </div>
      </main>
    </>
  );
}
