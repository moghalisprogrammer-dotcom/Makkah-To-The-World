"use client";
import { useLocale } from "./locale-provider";
import { brand } from "@/lib/brand";
import Image from "next/image";
export function Sponsor() {
  const { t } = useLocale();
  return (
    <div className="invite-sponsor">
      {brand.kaizenLogo ? (
        <Image
          src={brand.kaizenLogo}
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
      <span>{t(brand.kaizenRole)}</span>
    </div>
  );
}
