import type { Metadata } from "next";
import { WorkspaceHeader } from "@/components/workspace-header";
import { CheckIn } from "@/components/check-in";
export const metadata: Metadata = { title: "معاينة بوابة الدخول", robots: { index: false, follow: false } };
export default function CheckInPage() {
  const user = { display_name: "معاينة الاستقبال", role: "STAFF" as const, gate: 1 };
  return (
    <main className="admin-shell">
      <WorkspaceHeader user={user} />
      <div className="notice info container">واجهة استعراض فقط · التحقق وتسجيل الدخول يحتاجان ربط الخادم.</div>
      <CheckIn gate={user.gate} />
    </main>
  );
}
