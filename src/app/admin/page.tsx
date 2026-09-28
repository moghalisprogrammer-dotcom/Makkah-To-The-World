import type { Metadata } from "next";
import { WorkspaceHeader } from "@/components/workspace-header";
import { AdminDashboard } from "@/components/admin-dashboard";
export const metadata: Metadata = { title: "معاينة لوحة الإدارة", robots: { index: false, follow: false } };
export default function AdminPage() {
  const user = { display_name: "معاينة الإدارة", role: "ADMIN" as const, gate: null };
  return (
    <main className="admin-shell">
      <WorkspaceHeader user={user} />
      <div className="notice info container">واجهة استعراض فقط · سيتم ربط بياناتها بالخادم لاحقًا.</div>
      <AdminDashboard />
    </main>
  );
}
