import type { Metadata } from "next";
import { DigitalWorkshop } from "@/components/digital-workshop";
import { digitalWorkshop } from "@/lib/digital-workshop";
import "./workshop.css";

export const metadata: Metadata = {
  title: digitalWorkshop.title,
  description: digitalWorkshop.description,
};
export default function DigitalWorkshopPage() {
  return <DigitalWorkshop />;
}
