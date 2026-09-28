import { requireUser } from "@/lib/auth";
import { rows, type Registration } from "@/lib/db";
import { ageGroups } from "@/lib/event";
import { failure, json } from "@/lib/http";
import { SELECT_REG } from "@/lib/registrations";
import { workshopIds, type WorkshopId } from "@/lib/workshops";
export async function GET(request: Request) {
  try {
    await requireUser(true);
    const params = new URL(request.url).searchParams;
    const q = (params.get("q") || "").slice(0, 190);
    const filter = params.get("status") || "";
    const workshop = params.get("workshop") || "";
    const age = params.get("age") || "";
    const where: string[] = [];
    const values: (string | number)[] = [];
    if (q) {
      const term = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
      where.push(
        "(r.full_name LIKE ? OR r.email LIKE ? OR r.phone LIKE ? OR r.registration_number LIKE ? OR r.company LIKE ?)",
      );
      values.push(term, term, term, term, term);
    }
    if (["REGISTERED", "CHECKED_IN", "CANCELLED"].includes(filter)) {
      where.push("r.status=?");
      values.push(filter);
    }
    if (workshop === "none") {
      where.push("r.workshop_id IS NULL");
    } else if ((workshopIds as readonly string[]).includes(workshop)) {
      where.push("r.workshop_id=?");
      values.push(workshop);
    }
    if ((ageGroups as readonly string[]).includes(age)) {
      where.push("r.age_group=?");
      values.push(age);
    }
    const records = await rows<Registration>(
      `${SELECT_REG}${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY r.id DESC`,
      values,
    );
    const [stats] = await rows<{
      total: number;
      checked_in: number;
      pending: number;
      cancelled: number;
    }>(
      "SELECT COUNT(*) AS total,COALESCE(SUM(status='CHECKED_IN'),0) AS checked_in,COALESCE(SUM(status='REGISTERED'),0) AS pending,COALESCE(SUM(status='CANCELLED'),0) AS cancelled FROM registrations",
    );
    const gates = await rows(
      "SELECT u.id,u.display_name,u.gate,COUNT(r.id) AS count FROM users u LEFT JOIN registrations r ON r.checked_in_by=u.id AND r.status='CHECKED_IN' WHERE u.role='STAFF' GROUP BY u.id,u.display_name,u.gate ORDER BY u.gate",
    );
    const workshops = await rows<{
      workshop_id: WorkshopId | null;
      total: number;
      checked_in: number;
    }>(
      "SELECT workshop_id,COUNT(*) AS total,COALESCE(SUM(status='CHECKED_IN'),0) AS checked_in FROM registrations WHERE status<>'CANCELLED' GROUP BY workshop_id",
    );
    const [settings] = await rows<{ capacity: number }>(
      "SELECT capacity FROM event_settings WHERE id=1",
    );
    // Tokens are returned only on the individual ticket, never in lists or exports.
    return json({
      registrations: records.map(({ secure_token, ...r }) => r),
      stats,
      gates,
      workshops,
      capacity: settings.capacity,
    });
  } catch (error) {
    return failure(error);
  }
}
