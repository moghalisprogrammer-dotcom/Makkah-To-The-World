"use client";
import { useRef } from "react";
import { Mic2, X, Users } from "lucide-react";
import type { AgendaItem } from "@/lib/agenda";
import { appPath } from "@/lib/base-path";
import { useLocale } from "./locale-provider";

export function SessionParticipants({ item }: { item: AgendaItem }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();
  if (!item.participants?.length) return null;
  return <>
    <button type="button" className="session-people-trigger" onClick={() => dialog.current?.showModal()}>
      <Users size={15} aria-hidden="true" />{t("تعرّف على ضيوف الحوار")}
    </button>
    <dialog ref={dialog} className="session-people-dialog" aria-label={t("ضيوف الجلسة الحوارية")} onKeyDown={e => e.stopPropagation()} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className="session-people-content">
        <button type="button" className="session-people-close" aria-label={t("إغلاق")} onClick={() => dialog.current?.close()}><X size={22} /></button>
        <span className="session-people-eyebrow">{t("ضيوف الجلسة الحوارية")}</span>
        <h2>{t(item.title)}</h2>
        <div className="session-people-grid">
          {item.participants.map(person => <article key={person.name}>
            {person.image && <img src={appPath(person.image)} alt={t(person.name)} width={140} height={160} loading="lazy" />}
            <span><Mic2 size={13} aria-hidden="true" />{t(person.role)}</span>
            <h3>{t(person.name)}</h3>
            {person.expertise && <p className="speaker-expertise">{t(person.expertise)}</p>}
          </article>)}
        </div>
      </div>
    </dialog>
  </>;
}
