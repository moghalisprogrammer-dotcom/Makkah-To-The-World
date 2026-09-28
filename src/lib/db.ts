import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import type { WorkshopId } from "./workshops";
const globalDb = globalThis as unknown as { eventPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  if (!globalDb.eventPool) {
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 12,
      timezone: "Z",
      charset: "utf8mb4",
      decimalNumbers: true,
    });
    pool.on("connection", (connection) => {
      connection.query("SET time_zone = '+00:00'");
    });
    globalDb.eventPool = pool;
  }
  return globalDb.eventPool;
}
export async function rows<T>(
  sql: string,
  params: (string | number | boolean | Date | null)[] = [],
): Promise<T[]> {
  const [result] = await db().execute<RowDataPacket[]>(sql, params);
  return result as T[];
}
export interface User {
  id: number;
  username: string;
  display_name: string;
  role: "ADMIN" | "STAFF";
  gate: number | null;
}
export interface Registration {
  locale: "ar" | "en";
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  age_group: string;
  workshop_id: WorkshopId | null;
  registration_number: string;
  secure_token: string;
  status: "REGISTERED" | "CHECKED_IN" | "CANCELLED";
  created_at: string;
  checked_in_at: string | null;
  checked_in_by: number | null;
  staff_name?: string;
  email_status?: string;
}
