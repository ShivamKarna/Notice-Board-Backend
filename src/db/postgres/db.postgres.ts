import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgDB_URL } from "../../utils/env";
import * as schema from "./schemas/index";

const connectionString = pgDB_URL;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Export types
export type DbClient = typeof db;
