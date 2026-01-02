import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/postgres/schemas/index.ts", // Points to index that exports all
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_DATABASE_URL!,
  },
});
