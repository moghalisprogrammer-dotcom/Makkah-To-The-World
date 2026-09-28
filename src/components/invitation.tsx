"use client";
import { LanguageSwitch, useLocale } from "./locale-provider";
import { CollegeIdentity } from "./college-identity";
import { CinematicOpening } from "./cinematic-opening";
import { useTourismSound } from "./tourism-sound";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  CalendarDays,
  Clock3,
  Coffee,
  Compass,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Palette,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Volume2,
  VolumeX,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { event } from "@/lib/event";
import { agenda, arabicTime, workshops } from "@/lib/agenda";
import { Sponsor } from "./sponsor";
import { appPath } from "@/lib/base-path";
import { InvitationForm, emptyInvitation } from "./invitation-form";
import { useAccessibleReducedMotion } from "./use-reduced-motion";
const chapters = [
  { id: "welcome", label: "الدعوة" },
  { id: "experience", label: "التجربة" },
  { id: "agenda", label: "البرنامج" },
  { id: "workshops", label: "الورش" },
  { id: "location", label: "الوصول" },
  { id: "register", label: "حضورك" },
];
const destinations = [
  {
    src: "/images/alula.jpg",
    title: "العُلا",
    detail: "حكاية نحتها الزمن",
    position: "50% 48%",
  },
  {
    src: "/images/rijal-almaa.jpg",
    title: "رجال ألمع",
    detail: "ألوان الإرث السعودي",
    position: "50% 45%",
  },
  {
    src: "/images/turaif.jpg",
    title: "الدرعية · الطريف",
    detail: "من الجذور إلى المستقبل",
    position: "50% 50%",
  },
  {
    src: "/images/jeddah.jpg",
    title: "جدة التاريخية",
    detail: "حفاوة تسكن التفاصيل",
    position: "50% 43%",
  },
  {
    src: "/images/diriyah.jpg",
    title: "الدرعية",
    detail: "دروب تُلهم الخطوة القادمة",
    position: "50% 45%",
  },
];
const tracks = [
  {
    Icon: Compass,
    title: "وجهات تفتح آفاقك.",
    label: "السياحة والضيافة",
    text: "تجارب تفاعلية ولقاءات تجمع القطاع السياحي والفندقي. نكتشف فيها معنى الضيافة، ونرسم ملامح الرحلة القادمة.",
    destination: 0,
  },
  {
    Icon: Sparkles,
    title: "المستقبل أقرب.",
    label: "التقنية والذكاء الاصطناعي",
    text: "تجارب رقمية وأفكار مبتكرة تلتقي بالسياحة؛ لنرى كيف تعيد التقنية تشكيل تجربة الزائر.",
    destination: 2,
  },
  {
    Icon: Landmark,
    title: "حكايتنا، هويتنا.",
    label: "الثقافة والقهوة السعودية",
    text: "إرث حيّ، وحكايات أصيلة، وتجربة قهوة من أربع مناطق سعودية مع سارة الشهري.",
    destination: 1,
  },
  {
    Icon: GraduationCap,
    title: "معرفة ترافقك.",
    label: "التعليم والتدريب",
    text: "لقاءات وورش تطبيقية تصل المعرفة بالفرص، وتمنحك مهارات تستمر معك بعد الفعالية.",
    destination: 4,
  },
  {
    Icon: Palette,
    title: "السعودية بعيون مبدعيها.",
    label: "الفنون والإبداع",
    text: "معرض فني ومساحات للأفكار والتعبير. نلتقي لنرى وجهاتنا من زوايا جديدة.",
    destination: 3,
  },
];
function Action({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const [burst, setBurst] = useState(0);
  const reduced = useAccessibleReducedMotion();
  return (
    <motion.button
      type="button"
      disabled={disabled}
      className={`cinema-action ${secondary ? "secondary" : ""} ${className}`}
      onClick={() => {
        setBurst((v) => v + 1);
        onClick();
      }}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      whileHover={reduced ? undefined : { y: -2 }}
    >
      <span className="action-copy">{children}</span>
      <span className="action-orb">
        <ArrowLeft size={20} />
      </span>
      <AnimatePresence>
        {burst > 0 && (
          <motion.i
            aria-hidden="true"
            className="action-wave"
            key={burst}
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: 5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
function Reveal({
  children,
  as = "h2",
}: {
  children: string;
  as?: "h1" | "h2";
}) {
  const { t } = useLocale();
  const reduced = useAccessibleReducedMotion();
  const words = children.split(" ");
  const Tag = as;
  return (
    <Tag className="scene-title" aria-label={children}>
      {words.map((word, i) => (
        <span className="word-mask" aria-hidden="true" key={i}>
          <motion.span
            initial={reduced ? false : { y: "105%", rotate: 5, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: reduced ? 0 : 0.12 + i * 0.055,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
function Pager({
  page,
  count,
  onChange,
  label,
}: {
  page: number;
  count: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const { t } = useLocale();
  return (
    <div className="scene-pager" aria-label={label}>
      <button
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        aria-label={`${label} ${t("السابق")}`}
      >
        <ChevronRight size={19} />
      </button>
      <div>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            aria-label={`${label} ${i + 1}`}
            aria-current={page === i ? "true" : undefined}
            onClick={() => onChange(i)}
          >
            <span />
          </button>
        ))}
      </div>
      <button
        disabled={page === count - 1}
        onClick={() => onChange(page + 1)}
        aria-label={`${label} ${t("التالي")}`}
      >
        <ChevronLeft size={19} />
      </button>
    </div>
  );
}
export function Invitation() {
  const { t, locale } = useLocale();
  const [opening, setOpening] = useState(true);
  const { cue, setEnabled } = useTourismSound();
  const finishOpening = useCallback(() => {
    setOpening(false);
    requestAnimationFrame(() =>
      document.getElementById("cinema-main")?.focus({ preventScroll: true }),
    );
  }, []);
  const router = useRouter();
  const reduced = useAccessibleReducedMotion();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const activeRef = useRef(0);
  const [track, setTrack] = useState(0);
  const [agendaPage, setAgendaPage] = useState(0);
  const [workshop, setWorkshop] = useState(0);
  const [venueTab, setVenueTab] = useState(0);
  const [draft, setDraft] = useState(emptyInvitation);
  const [formStep, setFormStep] = useState(0);
  const [pageSize, setPageSize] = useState(4);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const [shift, setShift] = useState(0);
  const sceneRef = useRef<HTMLElement>(null);
  const interacted = useRef(false);
  const go = useCallback((next: number, push = true) => {
    if (next < 0 || next >= chapters.length || next === activeRef.current)
      return;
    setDirection(next > activeRef.current ? 1 : -1);
    activeRef.current = next;
    setActive(next);
    interacted.current = true;
    if (push) window.history.pushState(null, "", `#${chapters[next].id}`);
  }, []);
  useEffect(() => {
    const read = () => {
      let hash = location.hash.slice(1) || "welcome";
      if (hash === "venue-guide") hash = "location";
      const i = chapters.findIndex((c) => c.id === hash);
      if (i >= 0) go(i, false);
    };
    read();
    addEventListener("popstate", read);
    addEventListener("hashchange", read);
    return () => {
      removeEventListener("popstate", read);
      removeEventListener("hashchange", read);
    };
  }, [go]);
  useEffect(() => {
    const resize = () => {
      setPageSize(innerHeight < 740 ? 3 : 4);
      const v = window.visualViewport;
      const typing = document.activeElement?.matches(
        'input:not([type="checkbox"]):not([type="radio"]),textarea',
      );
      setKeyboardOpen(Boolean(typing && (v?.height || innerHeight) < 550));
      document.documentElement.style.setProperty(
        "--invitation-height",
        `${v?.height || innerHeight}px`,
      );
    };
    resize();
    addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    document.addEventListener("focusin", resize);
    document.addEventListener("focusout", resize);
    return () => {
      removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      document.removeEventListener("focusin", resize);
      document.removeEventListener("focusout", resize);
      document.documentElement.style.removeProperty("--invitation-height");
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          "input,select,textarea,button,a,summary",
        ) ||
        opening ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey
      )
        return;
      if (e.key === (locale === "ar" ? "ArrowLeft" : "ArrowRight")) {
        e.preventDefault();
        go(active + 1);
      }
      if (e.key === (locale === "ar" ? "ArrowRight" : "ArrowLeft")) {
        e.preventDefault();
        go(active - 1);
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [active, go, opening, locale]);
  useEffect(() => {
    if (reduced || active === 5) return;
    const timer = setInterval(() => {
      if (!document.hidden) setShift((v) => v + 1);
    }, 14000);
    return () => clearInterval(timer);
  }, [reduced, active]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        audio.current?.pause();
        void setEnabled(false);
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, [setEnabled]);
  const destination =
    active === 1
      ? destinations[tracks[track].destination]
      : destinations[(active + shift) % destinations.length];
  const count = Math.ceil(agenda.length / pageSize);
  const currentAgendaPage = Math.min(agendaPage, count - 1);
  useEffect(() => {
    if (!opening)
      cue(active + track + currentAgendaPage + workshop + venueTab + formStep);
  }, [
    active,
    track,
    currentAgendaPage,
    workshop,
    venueTab,
    formStep,
    cue,
    opening,
  ]);
  const advance = useCallback(() => {
    if (active === 1 && track < tracks.length - 1) {
      setTrack(track + 1);
      return;
    }
    if (active === 2 && currentAgendaPage < count - 1) {
      setAgendaPage(currentAgendaPage + 1);
      return;
    }
    if (active === 3 && workshop < workshops.length - 1) {
      setWorkshop(workshop + 1);
      return;
    }
    if (active === 4 && venueTab < 2) {
      setVenueTab(venueTab + 1);
      return;
    }
    go(active + 1);
  }, [active, count, currentAgendaPage, go, track, venueTab, workshop]);
  async function toggleSound() {
    if (!audio.current) return;
    if (playing) {
      audio.current.pause();
      void setEnabled(false);
      setPlaying(false);
      return;
    }
    try {
      audio.current.volume = 0.32;
      await Promise.all([audio.current.play(), setEnabled(true)]);
      setPlaying(true);
      setAudioError(false);
    } catch {
      void setEnabled(false);
      setAudioError(true);
    }
  }
  const modes = [
    { scale: 1.03, y: 10, rotate: 0 },
    { scale: 1.02, y: 8, rotate: 0 },
    { scale: 1.03, y: 10, rotate: 0 },
    { scale: 1.02, y: 8, rotate: 0 },
    { scale: 1.03, y: 10, rotate: 0 },
    { scale: 1.02, y: 8, rotate: 0 },
  ];
  const sceneVariants = {
    enter: (d: number) => ({
      ...modes[active],
      opacity: 0,
      x: d * -22,
      filter: "blur(3px)",
    }),
    shown: { scale: 1, y: 0, x: 0, rotate: 0, opacity: 1, filter: "blur(0px)" },
    leave: (d: number) => ({
      scale: 1.02,
      opacity: 0,
      x: d * 20,
      filter: "blur(2px)",
      transition: { duration: 0.3 },
    }),
  };
  return (
    <div
      className="cinematic-invitation"
      data-scene={chapters[active].id}
      data-keyboard={keyboardOpen ? "true" : undefined}
      data-opening={opening ? "true" : undefined}
    >
      <AnimatePresence>
        {opening && (
          <CinematicOpening
            onComplete={finishOpening}
            sound={playing}
            onSound={toggleSound}
            onCue={cue}
          />
        )}
      </AnimatePresence>
      <div className="invitation-content" inert={opening}>
        <a className="invite-skip" href="#cinema-main">
          {t("تجاوز إلى المحتوى")}
        </a>
        <div className="cinema-world" aria-hidden="true">
          <AnimatePresence initial={false}>
            <motion.div
              className="cinema-photo"
              key={destination.src}
              initial={{ opacity: 0, scale: reduced ? 1 : 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 1.08 }}
              transition={{ duration: reduced ? 0.1 : 1.5, ease: "easeInOut" }}
            >
              <img
                src={appPath(destination.src)}
                alt=""
                style={{ objectPosition: destination.position }}
                className={reduced ? "" : "photo-living"}
              />
            </motion.div>
          </AnimatePresence>
          <div className="cinema-gradient" />
          <div className="cinema-halo" />
          <div className="cinema-meridian" />
          <div className="cinema-grain" />
        </div>
        <header className="cinema-header">
          <a
            className="cinema-college"
            href="#welcome"
            onClick={(e) => {
              e.preventDefault();
              go(0);
            }}
            aria-label={t("كلية مكة الأهلية — بداية الدعوة")}
          >
            <CollegeIdentity />
          </a>
          <LanguageSwitch />
          <Sponsor />
        </header>
        <nav className="cinema-progress" aria-label={t("شرائح الدعوة")}>
          {chapters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => go(i)}
              aria-label={t(c.label)}
              aria-current={active === i ? "step" : undefined}
            >
              <span className="progress-mark">
                {i < active ? <Check size={9} /> : null}
              </span>
              <span className="progress-label">{t(c.label)}</span>
              {active === i && (
                <motion.i
                  layoutId="active-chapter"
                  className="progress-highlight"
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                />
              )}
            </button>
          ))}
        </nav>
        <main id="cinema-main" className="cinema-main" tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.section
              ref={sceneRef}
              tabIndex={-1}
              aria-label={t(chapters[active].label)}
              key={`${active}-${locale}-${opening}`}
              className={`cinema-scene scene-${chapters[active].id}`}
              custom={direction}
              variants={reduced ? undefined : sceneVariants}
              initial={reduced ? { opacity: 0 } : "enter"}
              animate={reduced ? { opacity: 1 } : "shown"}
              exit={reduced ? { opacity: 0 } : "leave"}
              transition={{
                duration: reduced ? 0.08 : 0.62,
                ease: [0.16, 1, 0.3, 1],
              }}
              onAnimationComplete={(definition) => {
                if (
                  definition === "leave" ||
                  (typeof definition === "object" &&
                    "opacity" in definition &&
                    definition.opacity === 0)
                )
                  return;
                const current = sceneRef.current;
                if (
                  interacted.current &&
                  current &&
                  !current.contains(document.activeElement)
                )
                  current.focus({ preventScroll: true });
              }}
            >
              {active === 0 && (
                <div className="welcome-stage">
                  <div className="welcome-story">
                    <p className="scene-eyebrow">
                      <span />
                      {t("من قسم السياحة والضيافة")}
                    </p>
                    <Reveal as="h1">{t("هنا، تبدأ الحكاية.")}</Reveal>
                    <div className="welcome-title">
                      <p>{t("ندعوك للاحتفال بـ")}</p>
                      <h2>
                        {t("يوم السياحة العالمي")} <em>2026</em>
                      </h2>
                      <p className="welcome-coffee">
                        <Coffee size={17} />
                        {t(event.companion)}
                      </p>
                    </div>
                    <div className="scene-event-line">
                      <span>
                        <CalendarDays size={16} />
                        {t("الخميس، 1 أكتوبر 2026")}
                      </span>
                      <span>
                        <Clock3 size={16} />
                        {t("9 صباحًا — 3 مساءً")}
                      </span>
                    </div>
                    <p className="welcome-note">
                      {t(
                        "نستقبلكم من 9:00 صباحًا في بهو الكلية، وفريق التنظيم حاضر لمساعدتكم.",
                      )}
                    </p>
                    <Action onClick={() => go(1)}>{t("ابدأ الرحلة")}</Action>
                    <button className="cinema-quiet" onClick={() => go(5)}>
                      {t("التسجيل متاح حتى اكتمال العدد")}
                      <ArrowUpLeft size={15} />
                    </button>
                  </div>
                  <div className="landmark-window" aria-hidden="true">
                    <div className="window-outline" />
                    <div className="window-orbit" />
                    <div className="landmark-caption">
                      <span className="destination-kicker">
                        {t("لمحة من المملكة")}
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={destination.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <strong>{t(destination.title)}</strong>
                          <span>{t(destination.detail)}</span>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
              {active === 1 && (
                <div className="experience-stage">
                  <div className="scene-heading">
                    <p className="scene-eyebrow">
                      <span />
                      {t("ملامح الفعالية")}
                    </p>
                    <Reveal>{t("يوم يجمع أهل القطاع.")}</Reveal>
                    <p className="scene-description">
                      {t(
                        "في بهو كلية مكة الأهلية، نلتقي حول السياحة والضيافة والتقنية والثقافة والتعليم والإبداع.",
                      )}
                    </p>
                  </div>
                  <div className="experience-focus">
                    <div
                      className="experience-tabs"
                      role="tablist"
                      aria-label={t("مسارات التجربة")}
                    >
                      {tracks.map(({ Icon, label }, i) => (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          role="tab"
                          aria-selected={track === i}
                          aria-controls="experience-panel"
                          id={`track-${i}`}
                          key={label}
                          onClick={() => setTrack(i)}
                          aria-label={t(label)}
                        >
                          <Icon size={23} />
                          <span>{t(label)}</span>
                        </motion.button>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.article
                        key={track}
                        id="experience-panel"
                        role="tabpanel"
                        aria-labelledby={`track-${track}`}
                        className="experience-panel"
                        initial={
                          reduced ? false : { opacity: 0, scale: 0.93, y: 15 }
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35 }}
                      >
                        <span className="panel-kicker">
                          {t(tracks[track].label)}
                        </span>
                        <h3>{t(tracks[track].title)}</h3>
                        <p>{t(tracks[track].text)}</p>
                      </motion.article>
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {active === 2 && (
                <div className="agenda-stage">
                  <div className="scene-heading">
                    <p className="scene-eyebrow">
                      <span />
                      {t("برنامج يومك")}
                    </p>
                    <Reveal>{t("برنامج اليوم، كما سيُقام.")}</Reveal>
                    <p className="scene-description">
                      {t("الخميس، 1 أكتوبر · من 9 صباحًا إلى 3 مساءً")}
                    </p>
                    <a
                      className="calendar-link"
                      href={appPath(locale === "en" ? "/event-en.ics" : "/event.ics")}
                      download
                    >
                      <CalendarDays size={16} />
                      {t("أضف الموعد إلى تقويمك")}
                      <ArrowUpLeft size={13} />
                    </a>
                  </div>
                  <div className="agenda-focus">
                    <div className="agenda-period">
                      <span>
                        {
                          [
                            t("الاستقبال والافتتاح"),
                            t("الجولة والعروض"),
                            t("الورش واللقاءات"),
                            t("التكريم والختام"),
                          ][currentAgendaPage]
                        }
                      </span>
                      <small>{t("بتوقيت مكة المكرمة")}</small>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        className="agenda-pages"
                        key={`${pageSize}-${currentAgendaPage}`}
                        initial={reduced ? false : { opacity: 0, x: -25 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 25 }}
                        transition={{ duration: 0.25 }}
                      >
                        {agenda
                          .slice(
                            currentAgendaPage * pageSize,
                            (currentAgendaPage + 1) * pageSize,
                          )
                          .map((item) => (
                            <article
                              className="cinema-agenda-item"
                              key={item.start}
                            >
                              <div className="item-clock">
                                <b>{arabicTime(item.start)}</b>
                                <span>{arabicTime(item.end)}</span>
                              </div>
                              <div>
                                <h3>{t(item.title)}</h3>
                                <p>
                                  {t(
                                    item.location ||
                                      item.speaker ||
                                      item.note ||
                                      "",
                                  )}
                                </p>
                              </div>
                            </article>
                          ))}
                      </motion.div>
                    </AnimatePresence>
                    <Pager
                      page={currentAgendaPage}
                      count={count}
                      onChange={setAgendaPage}
                      label={t("جزء البرنامج")}
                    />
                  </div>
                </div>
              )}
              {active === 3 && (
                <div className="workshop-stage">
                  <div className="scene-heading">
                    <p className="scene-eyebrow">
                      <span />
                      {t("ورش متزامنة")}
                    </p>
                    <Reveal>{t("اختر ورشة واحدة.")}</Reveal>
                    <p className="scene-description">
                      {t("ثلاث ورش متزامنة في الدور الثاني.")}
                      <br />
                      {t("يمكنك اختيار ورشة واحدة عند تأكيد حضورك.")}
                    </p>
                  </div>
                  <div className="workshop-focus">
                    <div
                      className="workshop-selector"
                      aria-label={t("ورش العمل")}
                    >
                      {workshops.map((w, i) => {
                        const Icon = [Sparkles, Coffee, ShieldCheck][i];
                        return (
                          <button
                            key={w.id}
                            onClick={() => setWorkshop(i)}
                            aria-label={t(w.title)}
                            aria-pressed={workshop === i}
                          >
                            <Icon size={19} />
                            <span>
                              {
                                [
                                  t("الظهور المهني"),
                                  t("مطابخ العالم"),
                                  t("سلامة الأغذية"),
                                ][i]
                              }
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.article
                        className="workshop-spotlight"
                        key={workshop}
                        initial={
                          reduced
                            ? false
                            : { opacity: 0, rotateY: -12, scale: 0.94 }
                        }
                        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.35 }}
                      >
                        <span className="workshop-start">
                          <Clock3 size={17} />
                          {arabicTime(workshops[workshop].start)}
                          {t("ظهرًا")}
                          <i>—</i> {t("1:00 مساءً")}
                        </span>
                        <h3>{t(workshops[workshop].title)}</h3>
                        <p>
                          {
                            [
                              t("لنبني حضورًا مهنيًا يعبّر عنّا."),
                              t("رحلة معرفة عبر ثقافات الطهي."),
                              t("معرفة تُعزز جودة الضيافة وسلامتها."),
                            ][workshop]
                          }
                        </p>
                        <div className="workshop-foot">
                          <span>
                            <MapPin size={15} />
                            {t("الدور الثاني")}
                          </span>
                          <button
                            onClick={() => {
                              setVenueTab(1);
                              go(4);
                            }}
                          >
                            {t("شاهد موقع الورش")}
                            <ArrowUpLeft size={16} />
                          </button>
                        </div>
                      </motion.article>
                    </AnimatePresence>
                    <p className="workshop-disclaimer">
                      {t("الظهور المهني 12:15 · الورشتان الأخريان 12:00")}
                    </p>
                  </div>
                </div>
              )}
              {active === 4 && (
                <div className="location-stage">
                  <div className="scene-heading">
                    <p className="scene-eyebrow">
                      <span />
                      {t("الوصول إلى الفعالية")}
                    </p>
                    <Reveal>{t("نلتقي في بهو الكلية.")}</Reveal>
                    <div className="venue-address">
                      <MapPin size={21} />
                      <div>
                        <strong>{t("كلية مكة الأهلية")}</strong>
                        <span>{t("بهو الكلية · مكة المكرمة")}</span>
                      </div>
                    </div>
                    <a
                      className="map-action"
                      href={event.maps}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="map-action-pin">
                        <MapPin size={20} />
                      </span>
                      <span className="map-action-copy">
                        <strong>{t("موقع كلية مكة الأهلية")}</strong>
                        <small>{t("افتح الاتجاهات في خرائط Google")}</small>
                      </span>
                      <ArrowUpLeft size={20} />
                    </a>
                  </div>
                  <div className="location-focus">
                    <div
                      className="location-tabs"
                      role="tablist"
                      aria-label={t("دليل الزيارة")}
                    >
                      {[t("يوم الزيارة"), t("داخل الكلية"), t("المساعدة")].map(
                        (label, i) => (
                          <button
                            role="tab"
                            aria-selected={venueTab === i}
                            aria-controls="location-panel"
                            id={`venue-${i}`}
                            key={label}
                            onClick={() => setVenueTab(i)}
                          >
                            {label}
                          </button>
                        ),
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={venueTab}
                        id="location-panel"
                        role="tabpanel"
                        aria-labelledby={`venue-${venueTab}`}
                        className="location-panel"
                        initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {venueTab === 0 ? (
                          <>
                            <div className="visit-item">
                              <TicketCheck />
                              <p>
                                <b>{t("تذكرتك معك")}</b>
                                {t("احفظ رمز QR على جوالك لإبرازه عند الوصول.")}
                              </p>
                            </div>
                            <div className="visit-item">
                              <ShieldCheck />
                              <p>
                                <b>{t("أربع بوابات لاستقبالك")}</b>
                                {t(
                                  "فريق التنظيم يتحقق من تذكرتك ويسعد بمساعدتك.",
                                )}
                              </p>
                            </div>
                            <div className="visit-item">
                              <Coffee />
                              <p>
                                <b>{t("الحفاوة تبدأ 9 صباحًا")}</b>
                                {t("تسجيل واستقبال، وقهوة سعودية تستقبلك.")}
                              </p>
                            </div>
                          </>
                        ) : venueTab === 1 ? (
                          <>
                            <div className="floor-item">
                              <b>M</b>
                              <p>
                                <strong>{t("المعرض والأركان")}</strong>
                                {t(
                                  "التجارب التفاعلية، المعرض الفني ومساحات التواصل.",
                                )}
                              </p>
                            </div>
                            <div className="floor-item">
                              <b>2</b>
                              <p>
                                <strong>{t("المسرح وورش العمل")}</strong>
                                {t(
                                  "جلسة مستقبل السياحة والورش الثلاث في الدور الثاني.",
                                )}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3>{t("يسعدنا مساعدتك.")}</h3>
                            <p>
                              {t(
                                "التسجيل متاح للجميع دون موافقة مسبقة حتى اكتمال العدد. إذا لم تصلك التذكرة، تحقق من البريد غير المرغوب فيه أو تواصل معنا.",
                              )}
                            </p>
                            <a
                              className="help-mail"
                              href={`mailto:${event.email}`}
                            >
                              <Mail size={17} />
                              <span dir="ltr">{event.email}</span>
                            </a>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {active === 5 && (
                <div className="register-stage">
                  <div className="registration-cinema-intro">
                    <p className="scene-eyebrow">
                      <span />
                      {t("مكانك بيننا")}
                    </p>
                    <Reveal>{t("دعوتك، على بُعد خطوة.")}</Reveal>
                    <p className="scene-description">
                      {t("نتعرّف عليك، تختار تجربتك،")}
                      <br />
                      {t("وتصل تذكرتك إلى بريدك.")}
                    </p>
                    <div className="register-event">
                      <span>
                        <CalendarDays size={17} />
                        {t(event.date)}
                      </span>
                      <span>
                        <Clock3 size={17} />
                        {t(event.time)}
                      </span>
                      <span>
                        <MapPin size={17} />
                        {t(event.location)}
                      </span>
                    </div>
                  </div>
                  <InvitationForm
                    data={draft}
                    setData={setDraft}
                    step={formStep}
                    setStep={setFormStep}
                    onSuccess={() => router.push("/registration/success")}
                  />
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </main>
        <footer className="cinema-footer">
          <div className="cinema-atmosphere">
            <button
              className={`cinema-sound ${playing ? "is-playing" : ""}`}
              onClick={toggleSound}
              aria-label={playing ? t("إيقاف الموسيقى") : t("تشغيل الموسيقى")}
              aria-pressed={playing}
            >
              {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>
                {audioError
                  ? t("تعذّر الصوت")
                  : playing
                    ? t("أجواء سعودية")
                    : t("شغّل الأجواء")}
              </span>
              <i />
              <i />
              <i />
            </button>
            <a href={appPath("/credits")} aria-label={t("حقوق الصور والموسيقى")}>
              {t("الحقوق")}
            </a>
          </div>
          <div className="cinema-location-caption">
            <MapPin size={12} />
            <span>{t(destination.title)}</span>
          </div>
          <div className="cinema-navigation">
            <motion.button
              whileTap={reduced ? undefined : { scale: 0.87 }}
              className="cinema-back"
              disabled={active === 0}
              onClick={() => go(active - 1)}
              aria-label={t("المشهد السابق")}
            >
              <ArrowRight size={19} />
            </motion.button>
            {active < 5 ? (
              <Action onClick={advance} className="cinema-next">
                {t("التالي")}
              </Action>
            ) : (
              <span className="registration-security">
                <ShieldCheck size={16} />
                {t("تسجيل آمن")}
              </span>
            )}
          </div>
        </footer>
      </div>
      <audio
        ref={audio}
        src={appPath("/audio/saudi-invitation.mp3")}
        loop
        preload="none"
      />
    </div>
  );
}
