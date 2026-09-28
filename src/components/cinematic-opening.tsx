"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Volume2, VolumeX, MapPin } from "lucide-react";
import { LanguageSwitch, useLocale } from "./locale-provider";
import { CollegeIdentity } from "./college-identity";
import { Sponsor } from "./sponsor";
import { useAccessibleReducedMotion } from "./use-reduced-motion";
import { appPath } from "@/lib/base-path";
import { SavedTicketLink } from "./saved-ticket-link";
const shots = [
  {
    src: "/images/alula.jpg",
    place: ["العُلا", "AlUla"],
    title: ["أرضٌ تروي.", "A land of stories."],
    subtitle: [
      "من صمت الصخر، تبدأ الدهشة",
      "Wonder, carved into the landscape",
    ],
    position: "40% 48%",
  },
  {
    src: "/images/rijal-almaa.jpg",
    place: ["رجال ألمع", "Rijal Almaa"],
    title: ["إرثٌ ينبض.", "A living heritage."],
    subtitle: [
      "ألوان وحكايات، تتوارثها الأجيال",
      "Colours and stories passed through generations",
    ],
    position: "50% 50%",
  },
  {
    src: "/images/turaif.jpg",
    place: ["الدرعية · الطريف", "Diriyah · At-Turaif"],
    title: ["جذورٌ تُلهم.", "Roots that inspire."],
    subtitle: ["هنا، يلتقي التاريخ بالغد", "Where history meets tomorrow"],
    position: "50% 50%",
  },
  {
    src: "/images/jeddah.jpg",
    place: ["جدة التاريخية", "Historic Jeddah"],
    title: ["وحفاوةٌ تجمعنا.", "A welcome that connects us."],
    subtitle: [
      "ومن كل وجهة… نلتقي في مكة",
      "From every destination… we meet in Makkah",
    ],
    position: "50% 44%",
  },
];
export function CinematicOpening({
  onComplete,
  sound,
  onSound,
  onCue,
}: {
  onComplete: () => void;
  sound: boolean;
  onSound: () => void;
  onCue: (i: number) => void;
}) {
  const { locale, ready } = useLocale();
  const en = locale === "en" ? 1 : 0;
  const reduced = useAccessibleReducedMotion();
  const [shot, setShot] = useState(0);
  const [visible, setVisible] = useState(true);
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    skip.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    for (const { src } of shots.slice(1)) {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "low";
      image.src = appPath(src);
    }
  }, []);
  useEffect(() => {
    if (!ready || !visible) return;
    const timer = setTimeout(
      () => {
        if (shot === shots.length - 1) onComplete();
        else setShot(shot + 1);
      },
      reduced ? 1750 : 2000,
    );
    return () => clearTimeout(timer);
  }, [shot, onComplete, ready, visible, reduced]);
  useEffect(() => {
    onCue(shot);
  }, [shot, onCue]);
  return (
    <motion.div
      className="cinema-opening"
      role="dialog"
      aria-modal="true"
      aria-label={
        en
          ? "A welcome from Makkah National College"
          : "ترحيب من كلية مكة الأهلية"
      }
      initial={false}
      exit={{
        opacity: 0,
        scale: reduced ? 1 : 1.06,
        filter: reduced ? "none" : "blur(5px)",
      }}
      transition={{ duration: 0.65 }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onComplete();
        if (e.key === "Tab") {
          const buttons = e.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href]",
          );
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          className="opening-shot"
          key={shot}
          initial={{ opacity: 0, scale: reduced ? 1 : shot % 2 ? 0.93 : 1.16 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : shot % 2 ? 1.1 : 1 }}
          transition={{ duration: reduced ? 0.18 : 0.85 }}
        >
          <img
            src={appPath(shots[shot].src)}
            alt=""
            style={{ objectPosition: shots[shot].position }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </motion.div>
      </AnimatePresence>
      <div className="opening-shade" />
      <header className="opening-brand">
        <CollegeIdentity />
        <Sponsor />
      </header>
      <div className="opening-topline">
        <LanguageSwitch />
        <span>
          {en
            ? "WORLD TOURISM DAY · 01 OCT 2026"
            : "يوم السياحة العالمي · 01 أكتوبر 2026"}
        </span>
      </div>
      <div className="opening-caption" aria-live="off">
        <AnimatePresence mode="wait">
          {ready && (
            <motion.div
              key={shot}
              initial={{ opacity: 0, y: reduced ? 0 : 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -20 }}
              transition={{ duration: 0.35 }}
            >
              <span className="opening-place">
                <MapPin size={14} />
                {shots[shot].place[en]}
              </span>
              <h1>{shots[shot].title[en]}</h1>
              <p>{shots[shot].subtitle[en]}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="opening-ticket-access">
        <SavedTicketLink />
      </div>
      <footer className="opening-footer">
        <button onClick={onSound} aria-pressed={sound} data-audio-toggle>
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>
            {en
              ? sound
                ? "Sound on"
                : "Enable sound"
              : sound
                ? "الصوت مفعّل"
                : "فعّل الصوت"}
          </span>
        </button>
        <div className="opening-timeline" aria-hidden="true">
          {shots.map((_, i) => (
            <span key={i} data-complete={i < shot}>
              <motion.i
                key={`${i}-${shot}`}
                initial={{ scaleX: i < shot ? 1 : 0 }}
                animate={{ scaleX: i <= shot ? 1 : 0 }}
                transition={{ duration: i === shot ? 2 : 0, ease: "linear" }}
              />
            </span>
          ))}
        </div>
        <button ref={skip} onClick={onComplete}>
          {en ? "Skip intro" : "تجاوز المقدمة"}
          <ArrowLeft size={17} />
        </button>
      </footer>
    </motion.div>
  );
}
