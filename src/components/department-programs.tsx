"use client";
import { useRef, useState } from "react";
import { GraduationCap, X, ArrowUpLeft, Mail } from "lucide-react";
import { academicPrograms, departmentCourses } from "@/lib/department-programs";
import { appPath } from "@/lib/base-path";
import { useLocale } from "./locale-provider";

export function DepartmentPrograms() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [training, setTraining] = useState(false);
  const [index, setIndex] = useState(0);
  const { t } = useLocale();
  const course = departmentCourses[index];
  return <>
    <button className="department-trigger" type="button" onClick={() => dialog.current?.showModal()}><GraduationCap size={18}/>{t("اكتشف برامج القسم")}<ArrowUpLeft size={16}/></button>
    <dialog ref={dialog} className="department-dialog" aria-label={t("برامج قسم السياحة والضيافة")} onKeyDown={e => e.stopPropagation()} onClick={e => { if(e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className="department-content">
        <button type="button" className="session-people-close" aria-label={t("إغلاق")} onClick={() => dialog.current?.close()}><X size={22}/></button>
        <header><span>{t("كلية مكة الأهلية")}</span><h2>{t("برامج قسم السياحة والضيافة")}</h2></header>
        <div className="department-tabs">
          <button type="button" aria-pressed={!training} onClick={() => setTraining(false)}>{t("المسارات الأكاديمية")}</button>
          <button type="button" aria-pressed={training} onClick={() => setTraining(true)}>{t("الدورات التدريبية")}</button>
        </div>
        {!training ? <div className="department-academic">{academicPrograms.map(program => <article key={program.title}><h3>{t(program.title)}</h3><p>{t(program.description)}</p></article>)}</div> : <section className="department-course" aria-live="polite">
          <h3 dir="auto">{t(course.title)}</h3>
          {course.qrImage && <img src={appPath(course.qrImage)} alt={t("رمز تفاصيل البرنامج")} width={220} height={220}/>}
          {course.url && <a className="department-open" href={course.url} target="_blank" rel="noopener noreferrer">{t("افتح تفاصيل البرنامج")}<ArrowUpLeft size={16}/></a>}
          <nav aria-label={t("تصفح الدورات")}><button type="button" disabled={index===0} onClick={() => setIndex(index-1)}>{t("السابق")}</button><span dir="ltr">{index+1} / {departmentCourses.length}</span><button type="button" disabled={index===departmentCourses.length-1} onClick={() => setIndex(index+1)}>{t("التالي")}</button></nav>
        </section>}
        <a className="department-contact" href="mailto:hospitality.dept@mnc.edu.sa"><Mail size={16}/><span>{t("استفسر من القسم")}<small dir="ltr">hospitality.dept@mnc.edu.sa</small></span></a>
      </div>
    </dialog>
  </>;
}
