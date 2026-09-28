import type { Metadata } from "next";
import { Header } from "@/components/header";
import { TicketView } from "@/components/ticket-view";
export const metadata: Metadata = {
  title: "تم التسجيل بنجاح",
  robots: { index: false, follow: false },
};
export default function Success() {
  return (
    <>
      <Header simple />
      <main className="light-page">
        <TicketView success />
      </main>
    </>
  );
}
