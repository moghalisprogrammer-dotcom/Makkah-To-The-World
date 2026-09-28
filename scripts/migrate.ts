import { db } from "../src/lib/db";
import { migrateWorkshops } from "./migrations";

migrateWorkshops()
  .then(() =>
    console.log(
      "Workshop selection migration complete; existing data preserved.",
    ),
  )
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Migration failed");
    process.exitCode = 1;
  })
  .finally(() => db().end());
