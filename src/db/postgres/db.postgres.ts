import { drizzle } from "drizzle-orm/postgres-js";

// You can specify any property from the postgres-js connection options
const db = drizzle({
  connection: {
    url: process.env.POSTGRES_DATABASE_URL,
    ssl: true,
  },
});

const result = await db.execute("select 1");
