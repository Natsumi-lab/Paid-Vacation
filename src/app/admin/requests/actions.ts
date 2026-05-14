"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { leaveRequests, leaveBalances } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  message: string;
};

export async function approveRequest(requestId: number): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "認証が必要です。" };
  }

  if (session.user.role !== "admin") {
    return { success: false, message: "この操作には管理者権限が必要です。" };
  }

  try {
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      return { success: false, message: "申請が見つかりません。" };
    }

    if (existingRequest.status !== "pending") {
      return { success: false, message: "この申請は既に処理済みです。" };
    }

    const adminId = Number(session.user.id);
    const now = new Date().toISOString();

    // 有給残高を更新
    const currentYear = new Date().getFullYear();
    const [balance] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.employeeId, existingRequest.employeeId),
          eq(leaveBalances.fiscalYear, currentYear)
        )
      )
      .limit(1);

    if (balance) {
      const remainingDays =
        balance.grantedDays + balance.carriedOverDays - balance.usedDays;

      if (remainingDays < existingRequest.days) {
        return { success: false, message: "有給残高が不足しています。" };
      }

      await db
        .update(leaveBalances)
        .set({
          usedDays: balance.usedDays + existingRequest.days,
          updatedAt: now,
        })
        .where(eq(leaveBalances.id, balance.id));
    }

    await db
      .update(leaveRequests)
      .set({
        status: "approved",
        approvedBy: adminId,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(leaveRequests.id, requestId));

    revalidatePath("/admin/requests");
    return { success: true, message: "申請を承認しました。" };
  } catch (error) {
    console.error("Approve request error:", error);
    return { success: false, message: "サーバーエラーが発生しました。" };
  }
}

export async function rejectRequest(
  requestId: number,
  rejectionReason: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "認証が必要です。" };
  }

  if (session.user.role !== "admin") {
    return { success: false, message: "この操作には管理者権限が必要です。" };
  }

  if (!rejectionReason || rejectionReason.trim() === "") {
    return { success: false, message: "却下理由を入力してください。" };
  }

  try {
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      return { success: false, message: "申請が見つかりません。" };
    }

    if (existingRequest.status !== "pending") {
      return { success: false, message: "この申請は既に処理済みです。" };
    }

    const adminId = Number(session.user.id);
    const now = new Date().toISOString();

    await db
      .update(leaveRequests)
      .set({
        status: "rejected",
        approvedBy: adminId,
        approvedAt: now,
        rejectionReason: rejectionReason.trim(),
        updatedAt: now,
      })
      .where(eq(leaveRequests.id, requestId));

    revalidatePath("/admin/requests");
    return { success: true, message: "申請を却下しました。" };
  } catch (error) {
    console.error("Reject request error:", error);
    return { success: false, message: "サーバーエラーが発生しました。" };
  }
}
