import type { Metadata } from "next";
import { protectPage } from "@/lib/auth";
import { WorkspaceHeader } from "@/components/workspace-header";
import { CheckIn } from "@/components/check-in";
export const metadata: Metadata = {
  title: "بوابة الدخول",
  robots: { index: false, follow: false },
};
export default async function CheckInPage() {
  const user = await protectPage();
  return (
    <main className="admin-shell">
      <WorkspaceHeader user={user} />
      <CheckIn gate={user.gate} />
    </main>
  );
}
