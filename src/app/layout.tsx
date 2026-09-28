import type { Metadata, Viewport } from "next";
import { appPath } from "@/lib/base-path";
import { LocaleProvider } from "@/components/locale-provider";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "./globals.css";
import "./agenda.css";
import "./invitation.css";
import "./cinematic.css";
import "../components/invitation-form.css";
import "./ticket-compact.css";
import "./opening.css";
import "./bilingual.css";
export const metadata: Metadata = {
  icons: {
    icon: [{ url: appPath("/images/college-seal.webp"), type: "image/webp" }],
    shortcut: appPath("/images/college-seal.webp"),
  },
  title: {
    default: "يوم السياحة العالمي 2026 | كلية مكة الأهلية",
    template: "%s | كلية مكة الأهلية",
  },
  description:
    "من مكة إلى العالم. احتفال يوم السياحة العالمي 2026 بالتزامن مع اليوم الدولي للقهوة السعودية، الخميس 1 أكتوبر في كلية مكة الأهلية.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#041B3D",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
