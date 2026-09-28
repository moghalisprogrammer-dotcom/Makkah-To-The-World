import { appPath } from "@/lib/base-path";

export function CollegeIdentity() {
  return (
    <span className="college-identity">
      <img src={appPath("/images/college-seal.webp")} alt="" width={48} height={48} />
      <span>
        <strong lang="ar" dir="rtl">
          كلية مكة الأهلية
        </strong>
        <small lang="en" dir="ltr">
          Makkah National College
        </small>
      </span>
    </span>
  );
}
