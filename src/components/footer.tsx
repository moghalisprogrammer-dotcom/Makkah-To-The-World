"use client";
import { useLocale } from "./locale-provider";
import Link from "next/link";
import { ArrowUpLeft, Globe, Mail } from "lucide-react";
import { event } from "@/lib/event";
import { Sponsor } from "./sponsor";
export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <img
              src="/images/college-logo.webp"
              alt={t("كلية مكة الأهلية")}
              width="215"
              height="81"
            />
            <p>
              {t("قسم السياحة والضيافة")}
              <br />
              {t("نفتح آفاق المعرفة، ونصنع تجارب تُلهم.")}
            </p>
          </div>
          <div className="footer-signature">
            <Sponsor />
          </div>
          <div className="footer-contact">
            <a href={`mailto:${event.email}`}>
              <Mail size={17} />
              <span dir="ltr">{event.email}</span>
            </a>
            <a href={event.website} target="_blank" rel="noreferrer">
              <Globe size={17} />
              <span dir="ltr">www.mnc.edu.sa</span>
              <ArrowUpLeft size={15} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t("© 2026 كلية مكة الأهلية. جميع الحقوق محفوظة.")}</span>
          <span>{t("بكل حفاوة، نرحّب بكم في مكة المكرمة.")}</span>
          <Link href="/login">
            {t("دخول فريق التنظيم")}
            <ArrowUpLeft size={13} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
