import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// O Neon Pooler funciona melhor na porta 5432 para SSL
// Vamos garantir que o driver use SSL forçado
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Força o uso de SSL
  max: 10,
});

// Adicionamos esse log para confirmar no painel da Vercel se o pool foi criado
console.log("[DB] Pool initialized with SSL: true");

export const db = drizzle(pool, { schema });