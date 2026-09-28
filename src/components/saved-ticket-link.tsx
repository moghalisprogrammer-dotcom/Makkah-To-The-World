"use client";
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import {
  forgetTicket,
  readSavedTicket,
  rememberTicket,
  savedTicketEvent,
} from "@/lib/saved-ticket";
import { appPath } from "@/lib/base-path";
import { useLocale } from "./locale-provider";

export function SavedTicketLink() {
  const { t } = useLocale();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const existing = readSavedTicket();
    if (existing) rememberTicket(existing); // Migrate registrations from older sessions.
    const update = (event?: Event) => {
      if (
        event instanceof StorageEvent &&
        (event.key === "makkah_ticket" || event.key === null) &&
        event.newValue === null
      )
        forgetTicket(event.oldValue || undefined);
      setToken(readSavedTicket());
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener(savedTicketEvent, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(savedTicketEvent, update);
    };
  }, []);
  if (!token) return null;
  return (
    <a className="saved-ticket-link" href={appPath(`/ticket/${token}`)}>
      <QrCode size={17} aria-hidden="true" />
      {t("تذكرتي ورمز الدخول")}
    </a>
  );
}
