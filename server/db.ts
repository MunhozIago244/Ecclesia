import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema.js";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env file");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Desativado para PostgreSQL local
});

export const db = drizzle(pool, { schema });