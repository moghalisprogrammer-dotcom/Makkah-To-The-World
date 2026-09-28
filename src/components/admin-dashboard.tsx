"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  UserCheck,
  Clock3,
  ChartNoAxesCombined,
  DoorOpen,
  Download,
  Search,
  X,
  Mail,
  Check,
  RotateCcw,
  LoaderCircle,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import type { Registration } from "@/lib/db";
import { formatDate, statusLabels, ageGroups, ageLabels } from "@/lib/event";
import { api } from "@/lib/client";
import {
  workshopIds,
  workshopLabel,
  workshopTime,
  type WorkshopId,
} from "@/lib/workshops";
type Row = Omit<Registration, "secure_token">;
interface Data {
  registrations: Row[];
  stats: {
    total: number;
    checked_in: number;
    pending: number;
    cancelled: number;
  };
  gates: { id: number; display_name: string; gate: number; count: number }[];
  workshops: {
    workshop_id: WorkshopId | null;
    total: number;
    checked_in: number;
  }[];
  capacity: number;
}
export function AdminDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [workshop, setWorkshop] = useState("");
  const [age, setAge] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState("");
  const [confirm, setConfirm] = useState<"UNDO" | "CANCEL" | null>(null);
  const modal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);
  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({ q: search, status, workshop, age });
      const result = await api<Data>(`/api/admin?${params.toString()}`);
      setData(result);
      setUpdated(new Date().toLocaleTimeString("ar-SA-u-nu-latn"));
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }, [age, search, status, workshop]);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (active && !document.hidden) await refresh();
      if (active) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refresh]);
  useEffect(() => {
    if (!selected) return;
    modal.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "Tab") {
        const els = modal.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href],input,select",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = before;
    };
  }, [selected]);
  async function action(type: "CHECK_IN" | "UNDO" | "CANCEL" | "RESEND") {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (type === "RESEND") {
        await api("/api/admin/resend", { id: selected.id });
        setMessage("تم إرسال التذكرة بنجاح.");
      } else {
        await api("/api/check-in", { id: selected.id, action: type });
        setMessage(
          type === "CHECK_IN"
            ? "تم تأكيد الدخول."
            : type === "UNDO"
              ? "تم التراجع عن تسجيل الدخول."
              : "تم إلغاء التسجيل.",
        );
        setSelected(null);
      }
      setConfirm(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const stats = data?.stats;
  const active = (stats?.total || 0) - (stats?.cancelled || 0);
  const percentage = active
    ? Math.round(((stats?.checked_in || 0) / active) * 100)
    : 0;
  const hasFilters = Boolean(search || status || workshop || age);
  const clearFilters = () => {
    setQuery("");
    setSearch("");
    setStatus("");
    setWorkshop("");
    setAge("");
  };
  const openDetails = (visitor: Row) => {
    setSelected(visitor);
    setConfirm(null);
    setMessage("");
  };
  return (
    <div className="workspace-body">
      <div className="container">
        <div className="workspace-title">
          <div>
            <h1>نظرة على الحضور</h1>
            <p>
              يوم السياحة العالمي 2026 · الخميس، 1 أكتوبر · كلية مكة الأهلية
            </p>
          </div>
          <span className="live-indicator">
            <i />
            {error ? "تعذر التحديث" : "تحديث تلقائي كل 5 ثوانٍ"}
          </span>
        </div>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="notice success" role="status">
            {message}
          </div>
        )}
        <div className="stats-grid">
          {[
            {
              label: "إجمالي المسجلين",
              value: stats?.total,
              icon: Users,
              detail: `السعة المتاحة: ${data?.capacity ?? "—"} تسجيل`,
            },
            {
              label: "تم تسجيل حضورهم",
              value: stats?.checked_in,
              icon: UserCheck,
              detail: "دخول مؤكّد من البوابات",
            },
            {
              label: "بانتظار الحضور",
              value: stats?.pending,
              icon: Clock3,
              detail: `التسجيلات الملغاة: ${stats?.cancelled ?? 0}`,
            },
            {
              label: "نسبة الحضور",
              value: `${percentage}%`,
              icon: ChartNoAxesCombined,
              detail: "من التسجيلات غير الملغاة",
            },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <span>{s.label}</span>
              <s.icon />
              <strong dir="ltr">{s.value ?? "—"}</strong>
              <small>{s.detail}</small>
            </div>
          ))}
        </div>
        <div className="gates-grid">
          {(
            data?.gates ||
            [1, 2, 3, 4].map((n) => ({
              id: n,
              display_name: `موظف البوابة ${n}`,
              gate: n,
              count: 0,
            }))
          ).map((g) => (
            <div className="gate-card" key={g.id}>
              <DoorOpen size={22} />
              <span>
                {g.display_name}
                <br />
                الدخول المسجّل
              </span>
              <strong>{g.count}</strong>
            </div>
          ))}
        </div>
        <section
          className="workshop-overview"
          aria-labelledby="workshop-overview-title"
        >
          <div className="workshop-overview-title">
            <div>
              <span className="workspace-kicker">نظرة سريعة</span>
              <h2 id="workshop-overview-title">حجوزات ورش العمل</h2>
            </div>
            <p>اضغط على أي ورشة لعرض مسجليها في السجل.</p>
          </div>
          <div className="workshop-insights">
            {[...workshopIds, "none" as const].map((id) => {
              const key = id === "none" ? null : id;
              const summary = data?.workshops.find(
                (item) => item.workshop_id === key,
              );
              const selected = workshop === id;
              return (
                <button
                  key={id}
                  className={`workshop-insight ${selected ? "is-selected" : ""}`}
                  onClick={() => setWorkshop(selected ? "" : id)}
                  aria-pressed={selected}
                >
                  <span>{workshopLabel(key)}</span>
                  <small>{key ? workshopTime(key) : "دون اختيار ورشة"}</small>
                  <strong dir="ltr">{summary?.total ?? 0}</strong>
                  <em>{summary?.checked_in ?? 0} حضروا</em>
                </button>
              );
            })}
          </div>
        </section>
        <section className="table-panel">
          <div className="table-toolbar">
            <h2>سجل الزوار</h2>
            <div className="search-wrap">
              <Search size={17} />
              <input
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، البريد، الجوال أو الرقم…"
                aria-label="البحث في المسجلين"
              />
            </div>
            <a href="/api/admin/export" className="button button-small">
              <Download size={16} />
              تصدير كل السجلات
            </a>
          </div>
          <div className="table-filters" aria-label="فلاتر سجل الزوار">
            <span className="filter-title">
              <SlidersHorizontal size={15} /> تصفية السجل
            </span>
            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="تصفية حسب الحالة"
            >
              <option value="">جميع الحالات</option>
              <option value="REGISTERED">بانتظار الحضور</option>
              <option value="CHECKED_IN">تم الحضور</option>
              <option value="CANCELLED">ملغي</option>
            </select>
            <select
              className="filter-select"
              value={workshop}
              onChange={(e) => setWorkshop(e.target.value)}
              aria-label="تصفية حسب ورشة العمل"
            >
              <option value="">كل خيارات الورش</option>
              {workshopIds.map((id) => (
                <option key={id} value={id}>
                  {workshopLabel(id)}
                </option>
              ))}
              <option value="none">حضور الفعالية دون ورشة</option>
            </select>
            <select
              className="filter-select"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              aria-label="تصفية حسب الفئة العمرية"
            >
              <option value="">كل الفئات العمرية</option>
              {ageGroups.map((value, index) => (
                <option key={value} value={value}>
                  {ageLabels[index]}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button className="clear-filters" onClick={clearFilters}>
                <XCircle size={15} /> مسح الفلاتر
              </button>
            )}
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>الزائر</th>
                  <th>رقم التسجيل</th>
                  <th>الجهة</th>
                  <th>الورشة</th>
                  <th>تاريخ التسجيل</th>
                  <th>الحالة</th>
                  <th>الدخول / الموظف</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data?.registrations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.full_name}</strong>
                      <small dir="ltr">{r.email}</small>
                      <small dir="ltr">{r.phone}</small>
                    </td>
                    <td dir="ltr">{r.registration_number}</td>
                    <td>{r.company || "—"}</td>
                    <td>
                      {workshopLabel(r.workshop_id)}
                      {r.workshop_id && (
                        <small>{workshopTime(r.workshop_id)}</small>
                      )}
                    </td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <span className={`status-pill ${r.status}`}>
                        {statusLabels[r.status]}
                      </span>
                    </td>
                    <td>
                      {formatDate(r.checked_in_at)}
                      <small>{r.staff_name || "—"}</small>
                    </td>
                    <td>
                      <button
                        className="table-button"
                        onClick={() => openDetails(r)}
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-mobile-list" aria-label="بطاقات سجل الزوار">
              {data?.registrations.map((r) => (
                <article className="admin-visitor-card" key={r.id}>
                  <div className="admin-visitor-top">
                    <div>
                      <h3>{r.full_name}</h3>
                      <span dir="ltr">{r.registration_number}</span>
                    </div>
                    <span className={`status-pill ${r.status}`}>
                      {statusLabels[r.status]}
                    </span>
                  </div>
                  <div className="admin-visitor-meta">
                    <span>
                      <small>الورشة</small>
                      {workshopLabel(r.workshop_id)}
                      {r.workshop_id && <em>{workshopTime(r.workshop_id)}</em>}
                    </span>
                    <span>
                      <small>سُجّل في</small>
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <button
                    className="admin-visitor-action"
                    onClick={() => openDetails(r)}
                  >
                    عرض بيانات الزائر
                  </button>
                </article>
              ))}
            </div>
            {!data ? (
              <div className="loading-block">
                <LoaderCircle className="spin" />
                جارٍ تحميل الحضور…
              </div>
            ) : (
              data.registrations.length === 0 && (
                <div className="empty-state">
                  {hasFilters
                    ? "لا توجد نتائج مطابقة للبحث."
                    : "لا توجد تسجيلات حتى الآن. ستظهر هنا بمجرد تسجيل الزوار."}
                </div>
              )
            )}
          </div>
          <div className="table-foot">
            <span>{data?.registrations.length ?? 0} سجل</span>
            <span>آخر تحديث: {updated || "—"} · توقيت مكة المكرمة</span>
          </div>
        </section>
      </div>
      {selected && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setSelected(null);
          }}
        >
          <div
            className="modal"
            ref={modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visitor-title"
          >
            <div className="modal-title">
              <h2 id="visitor-title">تفاصيل الزائر</h2>
              <button
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="إغلاق التفاصيل"
              >
                <X size={20} />
              </button>
            </div>
            <span className={`status-pill ${selected.status}`}>
              {statusLabels[selected.status]}
            </span>
            <dl className="detail-grid">
              {[
                ["الاسم", selected.full_name],
                ["رقم التسجيل", selected.registration_number],
                ["البريد الإلكتروني", selected.email],
                ["الجوال", selected.phone],
                ["الجهة", selected.company || "—"],
                ["المسمى الوظيفي", selected.job_title || "—"],
                ["الورشة المختارة", workshopLabel(selected.workshop_id)],
                ["وقت الورشة", workshopTime(selected.workshop_id) || "—"],
                [
                  "الفئة العمرية",
                  ageLabels[
                    ageGroups.indexOf(
                      selected.age_group as (typeof ageGroups)[number],
                    )
                  ] || selected.age_group,
                ],
                ["تاريخ التسجيل", formatDate(selected.created_at)],
                ["وقت الدخول", formatDate(selected.checked_in_at)],
                ["الموظف", selected.staff_name || "—"],
                [
                  "حالة البريد",
                  selected.email_status === "SENT"
                    ? "تم الإرسال"
                    : selected.email_status === "FAILED"
                      ? "تعذر الإرسال"
                      : "لم يُرسل بعد",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="notice success" role="status">
                {message}
              </div>
            )}
            {confirm ? (
              <div className="notice warning">
                <p style={{ color: "inherit" }}>
                  {confirm === "UNDO"
                    ? "هل تريد التراجع عن دخول هذا الزائر وإتاحة تذكرته للدخول مجددًا؟"
                    : "هل تريد إلغاء التسجيل؟ لن تعمل التذكرة بعد الإلغاء."}
                </p>
                <button
                  className="button button-small"
                  disabled={busy}
                  onClick={() => action(confirm)}
                >
                  تأكيد العملية
                </button>{" "}
                <button
                  className="table-button"
                  onClick={() => setConfirm(null)}
                >
                  رجوع
                </button>
              </div>
            ) : (
              <div className="modal-actions">
                {selected.status === "REGISTERED" && (
                  <button
                    disabled={busy}
                    className="button"
                    onClick={() => action("CHECK_IN")}
                  >
                    <Check size={16} />
                    تأكيد الدخول
                  </button>
                )}
                {selected.status === "CHECKED_IN" && (
                  <button
                    disabled={busy}
                    className="button button-outline"
                    onClick={() => setConfirm("UNDO")}
                  >
                    <RotateCcw size={16} />
                    التراجع عن الدخول
                  </button>
                )}
                {selected.status !== "CANCELLED" && (
                  <button
                    disabled={busy}
                    className="button button-outline"
                    onClick={() => action("RESEND")}
                  >
                    <Mail size={16} />
                    إعادة إرسال التذكرة
                  </button>
                )}
                {selected.status === "REGISTERED" && (
                  <button
                    disabled={busy}
                    className="danger-link"
                    onClick={() => setConfirm("CANCEL")}
                  >
                    إلغاء التسجيل
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
