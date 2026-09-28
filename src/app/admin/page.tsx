import type { Metadata } from "next";
import { protectPage } from "@/lib/auth";
import { WorkspaceHeader } from "@/components/workspace-header";
import { AdminDashboard } from "@/components/admin-dashboard";
export const metadata: Metadata = {
  title: "إدارة الحضور",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const user = await protectPage(true);
  return (
    <main className="admin-shell">
      <WorkspaceHeader user={user} />
      <AdminDashboard />
    </main>
  );
}
