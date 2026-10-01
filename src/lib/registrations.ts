import { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { db, rows, type Registration, type User } from "./db";
import { newToken } from "./security";
import { HttpError } from "./http";
import { registrationSchema } from "./validation";
export const SELECT_REG = `SELECT r.*,u.display_name AS staff_name,(SELECT status FROM email_logs e WHERE e.registration_id=r.id ORDER BY e.id DESC LIMIT 1) AS email_status FROM registrations r LEFT JOIN users u ON u.id=r.checked_in_by`;
export async function register(input: unknown) {
  const data = registrationSchema.parse(input);
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const [settings] = await connection.query<RowDataPacket[]>(
      "SELECT capacity FROM event_settings WHERE id=1 FOR UPDATE",
    );
    const [count] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM registrations WHERE status<>'CANCELLED'",
    );
    if (
      !settings[0] ||
      (settings[0].capacity > 0 && count[0].total >= settings[0].capacity)
    )
      throw new HttpError(409, "اكتمل العدد المتاح للتسجيل. شكرًا لاهتمامك.");
    const token = newToken();
    const [result] = await connection.execute<ResultSetHeader>(
      "INSERT INTO registrations (full_name,email,phone,company,job_title,age_group,workshop_id,secure_token,locale) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        data.full_name,
        data.email,
        data.phone,
        data.company,
        data.job_title,
        data.age_group,
        data.workshop_id,
        token,
        data.locale,
      ],
    );
    const number = `EVT-${String(result.insertId).padStart(4, "0")}`;
    await connection.execute(
      "UPDATE registrations SET registration_number=? WHERE id=?",
      [number, result.insertId],
    );
    await connection.commit();
    return (
      await rows<Registration>(`${SELECT_REG} WHERE r.id=?`, [result.insertId])
    )[0];
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      throw new HttpError(
        409,
        "هذا البريد مسجل مسبقًا. راجع تذكرتك في البريد أو تواصل مع الجهة المنظمة.",
      );
    throw error;
  } finally {
    connection.release();
  }
}
export async function changeEntry(
  id: number,
  user: User,
  action: "CHECK_IN" | "UNDO" | "CANCEL",
) {
  if (action !== "CHECK_IN" && user.role !== "ADMIN")
    throw new HttpError(403, "هذه العملية متاحة للمدير فقط.");
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    // Conditional update and audit insert are atomic, including simultaneous scans at different gates.
    let result: ResultSetHeader;
    if (action === "CHECK_IN")
      [result] = await connection.execute<ResultSetHeader>(
        "UPDATE registrations SET status='CHECKED_IN',checked_in_at=UTC_TIMESTAMP(),checked_in_by=? WHERE id=? AND status='REGISTERED'",
        [user.id, id],
      );
    else if (action === "UNDO")
      [result] = await connection.execute<ResultSetHeader>(
        "UPDATE registrations SET status='REGISTERED',checked_in_at=NULL,checked_in_by=NULL WHERE id=? AND status='CHECKED_IN'",
        [id],
      );
    else
      [result] = await connection.execute<ResultSetHeader>(
        "UPDATE registrations SET status='CANCELLED',checked_in_at=NULL,checked_in_by=NULL WHERE id=? AND status='REGISTERED'",
        [id],
      );
    if (result.affectedRows !== 1) {
      const [found] = await connection.execute<RowDataPacket[]>(
        "SELECT status FROM registrations WHERE id=?",
        [id],
      );
      if (!found[0]) throw new HttpError(404, "التذكرة غير موجودة.");
      throw new HttpError(
        409,
        found[0].status === "CHECKED_IN"
          ? "سبق تسجيل دخول هذا الزائر."
          : found[0].status === "CANCELLED"
            ? "هذا التسجيل ملغي."
            : "حالة التسجيل تغيرت. يرجى تحديث البيانات.",
      );
    }
    await connection.execute(
      "INSERT INTO check_in_logs (registration_id,staff_id,action) VALUES (?,?,?)",
      [id, user.id, action],
    );
    await connection.commit();
    return (await rows<Registration>(`${SELECT_REG} WHERE r.id=?`, [id]))[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export function publicStaffRecord(r: Registration) {
  return {
    id: r.id,
    full_name: r.full_name,
    registration_number: r.registration_number,
    company: r.company,
    email: r.email,
    phone: r.phone,
    job_title: r.job_title,
    age_group: r.age_group,
    created_at: r.created_at,
    locale: r.locale,
    workshop_id: r.workshop_id,
    status: r.status,
    checked_in_at: r.checked_in_at,
    staff_name: r.staff_name,
  };
}
