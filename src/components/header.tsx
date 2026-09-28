"use client";
import { LanguageSwitch, useLocale } from "./locale-provider";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpLeft, Menu, X } from "lucide-react";
import { Sponsor } from "./sponsor";
export function Header({ simple = false }: { simple?: boolean }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          href="/"
          className="brand"
          aria-label={t("كلية مكة الأهلية — الرئيسية")}
        >
          <img
            src="/images/college-logo.svg"
            alt={t("كلية مكة الأهلية")}
            width="206"
            height="78"
          />
        </Link>
        {simple ? (
          <div className="header-language">
            <LanguageSwitch />
            <Sponsor />
          </div>
        ) : (
          <>
            <nav
              className={open ? "main-nav open" : "main-nav"}
              aria-label={t("القائمة الرئيسية")}
            >
              <a onClick={() => setOpen(false)} href="#about">
                {t("عن الفعالية")}
              </a>
              <a onClick={() => setOpen(false)} href="#experience">
                {t("مسارات التجربة")}
              </a>
              <a onClick={() => setOpen(false)} href="#agenda">
                {t("البرنامج والورش")}
              </a>
              <a onClick={() => setOpen(false)} href="#location">
                {t("الموقع والموعد")}
              </a>
              <a onClick={() => setOpen(false)} href="#faq">
                {t("الأسئلة الشائعة")}
              </a>
            </nav>
            <a className="button button-small header-cta" href="#register">
              {t("احجز مقعدك")}
              <ArrowUpLeft size={17} />
            </a>
            <button
              className="icon-button mobile-menu"
              aria-label={open ? t("إغلاق القائمة") : t("فتح القائمة")}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
