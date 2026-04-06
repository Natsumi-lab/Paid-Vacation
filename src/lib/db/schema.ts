import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// 従業員テーブル
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeNumber: text("employee_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  hireDate: text("hire_date").notNull(), // YYYY-MM-DD形式
  role: text("role", { enum: ["admin", "employee"] }).notNull().default("employee"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// 有給残高テーブル
export const leaveBalances = sqliteTable("leave_balances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  fiscalYear: integer("fiscal_year").notNull(), // 年度（例: 2024）
  grantedDays: real("granted_days").notNull().default(0), // 付与日数
  usedDays: real("used_days").notNull().default(0), // 使用日数
  carriedOverDays: real("carried_over_days").notNull().default(0), // 繰越日数
  expiresAt: text("expires_at").notNull(), // 有効期限 YYYY-MM-DD
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// 有給申請テーブル
export const leaveRequests = sqliteTable("leave_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  requestDate: text("request_date").notNull(), // 取得希望日 YYYY-MM-DD
  leaveType: text("leave_type", { enum: ["full", "am_half", "pm_half"] }).notNull(),
  days: real("days").notNull(), // 消化日数（1.0 or 0.5）
  reason: text("reason"),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  approvedBy: integer("approved_by").references(() => employees.id),
  approvedAt: text("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// パスワードリセットトークンテーブル
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// 型エクスポート
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
