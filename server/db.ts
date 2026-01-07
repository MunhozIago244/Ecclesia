import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Configuração do Pool com SSL para Neon
// O Neon requer SSL, então garantimos que está configurado
const connectionString = process.env.DATABASE_URL;

// Se a URL não tiver sslmode, adiciona automaticamente
const dbUrl = connectionString.includes("sslmode=")
  ? connectionString
  : `${connectionString}${
      connectionString.includes("?") ? "&" : "?"
    }sslmode=require`;

export const pool = new Pool({
  connectionString: dbUrl,
  // Configurações adicionais para produção
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL explícito para garantir conexão segura
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Teste de conexão ao inicializar
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client", err);
  console.error("[DB] Error details:", {
    message: err.message,
    code: (err as any).code,
    stack: err.stack,
  });
});

// Log de conexão bem-sucedida
pool.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[DB] New client connected to database");
  }
});

// Log quando cliente é removido do pool
pool.on("remove", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[DB] Client removed from pool");
  }
});

export const db = drizzle(pool, { schema });
