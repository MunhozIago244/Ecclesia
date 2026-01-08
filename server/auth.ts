import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);
const PgSession = connectPgSimple(session);

// --- UTILITÁRIOS DE SEGURANÇA ---

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (e) {
    return false;
  }
}

// --- MIDDLEWARES DE PERMISSÃO (RBAC) ---

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Sessão expirada ou não autenticada." });
}

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res
    .status(403)
    .json({ message: "Acesso restrito: Requer privilégios de Administrador." });
}

export function ensureLeader(req: Request, res: Response, next: NextFunction) {
  if (
    req.isAuthenticated() &&
    (req.user?.role === "admin" || req.user?.role === "leader")
  ) {
    return next();
  }
  res
    .status(403)
    .json({ message: "Acesso restrito: Requer nível de Liderança." });
}

// --- CONFIGURAÇÃO PRINCIPAL DO PASSPORT ---

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "church_management_secret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Necessário para cookies seguros em proxies (Heroku, Render, etc)
    store: new PgSession({
      pool,
      createTableIfMissing: true,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      secure: app.get("env") === "production",
      sameSite: "lax",
      httpOnly: true, // Impede acesso via JavaScript (Proteção contra XSS)
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          // Usamos uma verificação genérica para não informar se o e-mail existe ou não
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, {
              message: "E-mail ou senha incorretos.",
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id as number);
      if (user) {
        const { password, ...safeUser } = user; // Remove a senha por segurança
        done(null, safeUser);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  // --- ENDPOINTS DE AUTENTICAÇÃO ---

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este e-mail já está em uso." });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: req.body.role || "user",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Credenciais inválidas" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...safeUser } = user;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.patch("/api/user", ensureAuthenticated, async (req, res) => {
    try {
      const id = (req.user as any).id;
      // Remove campos sensíveis que não devem ser alterados por aqui
      const { role, active, password: _, ...updateData } = req.body;
      const updated = await storage.updateUser(id, updateData);
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao atualizar perfil." });
    }
  });
}
