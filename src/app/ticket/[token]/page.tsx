import type { Metadata } from "next";
import { Header } from "@/components/header";
import { TicketView } from "@/components/ticket-view";
export const metadata: Metadata = {
  title: "تذكرة الحضور",
  robots: { index: false, follow: false },
};
export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <>
      <Header simple />
      <main className="light-page">
        <TicketView token={token} />
      </main>
    </>
  );
}
