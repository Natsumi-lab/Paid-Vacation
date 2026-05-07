import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaveBalances, leaveRequests, employees, type LeaveBalance, type LeaveRequest } from "@/lib/db/schema";

// 現在の年度を取得（4月始まり）
function getCurrentFiscalYear(): number {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  // 4月始まりの年度計算：1-3月は前年度
  return month < 4 ? year - 1 : year;
}

// 有給残日数を計算
function calculateRemainingDays(balance: LeaveBalance): number {
  const total = balance.grantedDays + balance.carriedOverDays;
  return total - balance.usedDays;
}

// 有給残高の取得結果
export type LeaveBalanceSummary = {
  fiscalYear: number;
  grantedDays: number;
  carriedOverDays: number;
  usedDays: number;
  remainingDays: number;
  expiresAt: string;
};

/**
 * 従業員の今年度の有給残高を取得
 */
export async function getLeaveBalanceByEmployeeId(
  employeeId: number
): Promise<LeaveBalanceSummary | null> {
  const currentYear = getCurrentFiscalYear();

  const balance = await db.query.leaveBalances.findFirst({
    where: and(
      eq(leaveBalances.employeeId, employeeId),
      eq(leaveBalances.fiscalYear, currentYear)
    ),
  });

  if (!balance) {
    return null;
  }

  return {
    fiscalYear: balance.fiscalYear,
    grantedDays: balance.grantedDays,
    carriedOverDays: balance.carriedOverDays,
    usedDays: balance.usedDays,
    remainingDays: calculateRemainingDays(balance),
    expiresAt: balance.expiresAt,
  };
}

// 有給申請の表示用型
export type LeaveRequestDisplay = {
  id: number;
  requestDate: string;
  leaveType: "full" | "am_half" | "pm_half";
  days: number;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
};

// 有給タイプのラベル
export const LEAVE_TYPE_LABELS: Record<LeaveRequest["leaveType"], string> = {
  full: "全日",
  am_half: "午前半休",
  pm_half: "午後半休",
};

// ステータスのラベル
export const STATUS_LABELS: Record<LeaveRequest["status"], string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
};

/**
 * 従業員の最近の有給申請を取得（最大5件）
 */
export async function getRecentRequestsByEmployeeId(
  employeeId: number,
  limit: number = 5
): Promise<LeaveRequestDisplay[]> {
  const requests = await db.query.leaveRequests.findMany({
    where: eq(leaveRequests.employeeId, employeeId),
    orderBy: [desc(leaveRequests.createdAt)],
    limit,
  });

  return requests.map((request) => ({
    id: request.id,
    requestDate: request.requestDate,
    leaveType: request.leaveType,
    days: request.days,
    status: request.status,
    reason: request.reason,
  }));
}

/**
 * 承認待ちの申請数を取得
 */
export async function getPendingRequestCount(employeeId: number): Promise<number> {
  const requests = await db.query.leaveRequests.findMany({
    where: and(
      eq(leaveRequests.employeeId, employeeId),
      eq(leaveRequests.status, "pending")
    ),
  });

  return requests.length;
}

/**
 * 従業員のすべての有給申請を取得
 */
export async function getAllRequestsByEmployeeId(
  employeeId: number
): Promise<LeaveRequestDisplay[]> {
  const requests = await db.query.leaveRequests.findMany({
    where: eq(leaveRequests.employeeId, employeeId),
    orderBy: [desc(leaveRequests.createdAt)],
  });

  return requests.map((request) => ({
    id: request.id,
    requestDate: request.requestDate,
    leaveType: request.leaveType,
    days: request.days,
    status: request.status,
    reason: request.reason,
  }));
}

// 管理者用: 申請+従業員情報の表示用型
export type AdminLeaveRequestDisplay = {
  id: number;
  requestDate: string;
  leaveType: "full" | "am_half" | "pm_half";
  days: number;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  createdAt: string;
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  department: string;
};

/**
 * 管理者用: すべての有給申請を従業員情報と共に取得
 */
export async function getAllRequestsForAdmin(): Promise<AdminLeaveRequestDisplay[]> {
  const requests = await db
    .select({
      id: leaveRequests.id,
      requestDate: leaveRequests.requestDate,
      leaveType: leaveRequests.leaveType,
      days: leaveRequests.days,
      status: leaveRequests.status,
      reason: leaveRequests.reason,
      createdAt: leaveRequests.createdAt,
      employeeId: leaveRequests.employeeId,
      employeeName: employees.name,
      employeeNumber: employees.employeeNumber,
      department: employees.department,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .orderBy(desc(leaveRequests.createdAt));

  return requests;
}

/**
 * 管理者用: ステータス別の申請数を取得
 */
export async function getRequestCountsByStatus(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  const requests = await db.query.leaveRequests.findMany();

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return {
    pending,
    approved,
    rejected,
    total: requests.length,
  };
}
