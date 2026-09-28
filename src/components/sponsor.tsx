"use client";
import { useLocale } from "./locale-provider";
import { brand } from "@/lib/brand";
import Image from "next/image";
import { appPath } from "@/lib/base-path";
export function Sponsor({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  return (
    <a
      className="invite-sponsor"
      href={brand.kaizenWebsite}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t("كايزن جروب")} — ${t(brand.kaizenRole)} (${brand.kaizenWebsite})`}
    >
      {brand.kaizenLogo ? (
        <Image
          src={appPath(brand.kaizenLogo)}
          alt={t("كايزن جروب")}
          width={360}
          height={120}
          sizes="(max-width:760px) 114px, 132px"
          priority
        />
      ) : (
        <strong className="kaizen-name">
          {brand.kaizenName}
          <small>KAIZEN</small>
        </strong>
      )}
      <span>{t(compact ? "شريك استراتيجي" : brand.kaizenRole)}</span>
    </a>
  );
}
