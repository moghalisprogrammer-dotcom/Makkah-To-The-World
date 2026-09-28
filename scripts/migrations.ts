import type { RowDataPacket } from "mysql2/promise";
import { db } from "../src/lib/db";

/** Additive migration: existing registrations keep a NULL workshop selection. */
export async function migrateWorkshops() {
  const connection = await db().getConnection();
  let locked = false;
  try {
    const [lock] = await connection.query<RowDataPacket[]>(
      "SELECT GET_LOCK('makkah_workshop_selection_migration',30) AS acquired",
    );
    if (Number(lock[0].acquired) !== 1)
      throw new Error("Could not acquire the database migration lock");
    locked = true;
    const [columns] = await connection.execute<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='registrations' AND COLUMN_NAME='workshop_id'",
    );
    if (columns.length === 0) {
      await connection.query(
        "ALTER TABLE registrations ADD COLUMN workshop_id ENUM('digital','kitchens','food-safety') NULL DEFAULT NULL AFTER age_group",
      );
    }
    const [localeColumns] = await connection.execute<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='registrations' AND COLUMN_NAME='locale'",
    );
    if (localeColumns.length === 0) {
      await connection.query(
        "ALTER TABLE registrations ADD COLUMN locale ENUM('ar','en') NOT NULL DEFAULT 'ar' AFTER age_group",
      );
    }
  } finally {
    if (locked)
      await connection.query(
        "SELECT RELEASE_LOCK('makkah_workshop_selection_migration')",
      );
    connection.release();
  }
}
