import type { MetadataRoute } from "next";
import { appPath } from "@/lib/base-path";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: appPath("/"),
      disallow: [
        appPath("/admin"),
        appPath("/check-in"),
        appPath("/login"),
        appPath("/ticket/"),
        appPath("/registration/"),
        appPath("/api/"),
      ],
    },
  };
}
