import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import type { Express, RequestHandler } from "express";

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "hvac-management-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.session && (req.session as any).userId) {
    try {
      const user = await getUserById((req.session as any).userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    } catch (error) {
      console.error("Error fetching user in auth middleware:", error);
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// User management functions
export async function createUser(userData: InsertUser): Promise<User> {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const [user] = await db
    .insert(users)
    .values({
      ...userData,
      password: hashedPassword,
    })
    .returning();
  
  return user;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}