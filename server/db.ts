import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

const connectionString = process.env.DATABASE_URL;

// Melhora a verificação da URL para evitar erros de caracteres
const dbUrl = connectionString.includes("sslmode=")
  ? connectionString
  : `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslmode=require`;

export const pool = new Pool({
  connectionString: dbUrl,
  max: 10, // Reduzi para 10 para ser mais amigável ao plano gratuito do Neon
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Aumentado para dar tempo da Vercel "acordar"
  // SSL configurado para aceitar o certificado do Neon na Vercel
  ssl: {
    rejectUnauthorized: false
  },
});

// Logs de erro para debug no painel da Vercel
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client", err.message);
});

export const db = drizzle(pool, { schema });