import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  hostPublicKey: text("host_public_key").notNull(),
  signature: text("signature").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: text("is_active").default("true").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});

export const sessionJoinSchema = z.object({
  sessionId: z.string().min(1),
  clientPublicKey: z.string().min(1),
});

export const messageSchema = z.object({
  sessionId: z.string(),
  encryptedContent: z.string(),
  nonce: z.string(),
  timestamp: z.number(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SessionJoin = z.infer<typeof sessionJoinSchema>;
export type Message = z.infer<typeof messageSchema>;
