import {
  pgTable,
  varchar,
  uuid,
  numeric,
  integer,
  boolean,
  jsonb,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ── Users (synced from Clerk on first API call) ────────────────────────────
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

// ── Settings (one row per user) ────────────────────────────────────────────
export const settings = pgTable(
  "settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenant1stFloorName: varchar("tenant_1st_floor_name", { length: 255 })
      .default("1st Floor Tenant")
      .notNull(),
    tenant2ndFloorName: varchar("tenant_2nd_floor_name", { length: 255 })
      .default("2nd Floor Tenant")
      .notNull(),
    defaultRent1st: numeric("default_rent_1st", { precision: 12, scale: 2 })
      .default("22000")
      .notNull(),
    defaultRent2nd: numeric("default_rent_2nd", { precision: 12, scale: 2 })
      .default("22000")
      .notNull(),
    ssgcSplitRatio: jsonb("ssgc_split_ratio")
      .$type<{ ground: number; first: number; second: number }>()
      .notNull(),
    motorSplitRatio: jsonb("motor_split_ratio")
      .$type<{ ground: number; first: number; second: number }>()
      .notNull(),
    onboarded: boolean("onboarded").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdUnique: unique("settings_user_id_unique").on(t.userId),
  }),
);

export type Settings = typeof settings.$inferSelect;

// ── Monthly Records (one per user per month) ───────────────────────────────
export const monthlyRecords = pgTable(
  "monthly_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    monthYear: varchar("month_year", { length: 7 }).notNull(), // "2026-06"
    year: integer("year").notNull(),
    status: varchar("status", { length: 20 }).default("draft").notNull(), // "draft" | "finalized"
    snapshot: jsonb("snapshot").notNull(),
    groundFloor: jsonb("ground_floor").notNull(),
    firstFloor: jsonb("first_floor").notNull(),
    secondFloor: jsonb("second_floor").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userMonthUnique: unique("monthly_records_user_month_unique").on(
      t.userId,
      t.monthYear,
    ),
  }),
);

export type MonthlyRecord = typeof monthlyRecords.$inferSelect;

// ── Receipts (one image per bill entry per record) ─────────────────────────
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recordId: uuid("record_id")
    .notNull()
    .references(() => monthlyRecords.id, { onDelete: "cascade" }),
  fieldRef: varchar("field_ref", { length: 100 }).notNull(), // e.g. "groundFloor.ke"
  imageData: text("image_data"), // full data URL: "data:image/jpeg;base64,..."
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
