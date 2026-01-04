import app from "./app";
import { CORS_ORIGIN, PORT } from "./utils/env";
import { NODE_ENV } from "./utils/env";
import { db } from "./db/postgres/db.postgres";
import { sql } from "drizzle-orm";

app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Cors Enabled for Origin: ${CORS_ORIGIN}`);

  // Test database connection
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("✗ Database connection failed:", error);
  }
});
