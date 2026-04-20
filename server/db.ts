import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { AiModel, AuditLog, Component, InsertAiModel, InsertAuditLog, InsertComponent, InsertSoarApproach, InsertUser, SoarApproach, User, aiModels, auditLogs, components, soarApproaches, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'Admin' as any; updateSet.role = 'Admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(id: number, role: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// ─── Components ──────────────────────────────────────────────────────────────

export async function getAllComponents(): Promise<Component[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(components).orderBy(components.id);
}

export async function getComponentBySlug(slug: string): Promise<Component | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(components).where(eq(components.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateComponent(id: number, data: Partial<InsertComponent>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(components).set({ ...data, updatedAt: new Date() }).where(eq(components.id, id));
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export async function createAuditLog(log: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(log);
}

export async function getAuditLogs(opts?: {
  userId?: number;
  action?: string;
  userName?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const conditions = [];
  if (opts?.userId) conditions.push(eq(auditLogs.userId, opts.userId));
  if (opts?.action) conditions.push(like(auditLogs.action, `%${opts.action}%`));
  if (opts?.userName) conditions.push(like(auditLogs.userName, `%${opts.userName}%`));
  if (opts?.from) conditions.push(gte(auditLogs.createdAt, opts.from));
  if (opts?.to) conditions.push(lte(auditLogs.createdAt, opts.to));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [logs, countResult] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
  ]);

  return { logs, total: Number(countResult[0]?.count ?? 0) };
}

export async function getRecentAuditLogs(limit = 10): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ─── SOAR Approaches ─────────────────────────────────────────────────────────

export async function getAllSoarApproaches(): Promise<SoarApproach[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(soarApproaches).orderBy(soarApproaches.id);
}

export async function updateSoarApproach(id: number, data: Partial<InsertSoarApproach>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(soarApproaches).set({ ...data, updatedAt: new Date() }).where(eq(soarApproaches.id, id));
}

export async function triggerSoarApproach(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(soarApproaches).set({
    lastTriggered: new Date(),
    triggerCount: sql`${soarApproaches.triggerCount} + 1`,
    updatedAt: new Date(),
  }).where(eq(soarApproaches.id, id));
}

// ─── AI Models ───────────────────────────────────────────────────────────────

export async function getAllAiModels(): Promise<AiModel[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiModels).orderBy(aiModels.id);
}

export async function updateAiModel(id: number, data: Partial<InsertAiModel>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(aiModels).set({ ...data, updatedAt: new Date() }).where(eq(aiModels.id, id));
}

export async function getAiModelBySlug(slug: string): Promise<AiModel | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiModels).where(eq(aiModels.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
