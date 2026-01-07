import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Configuração otimizada para o Neon na Vercel
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Garante que o SSL funcione na Vercel
  },
  max: 10,
});

console.log("[DB] Pool initialized with SSL configuration");

export const db = drizzle(pool, { schema });