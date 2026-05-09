import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { leaveRequests, leaveBalances } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type UpdateRequestBody = {
  action: "approve" | "reject";
  rejectionReason?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です。" },
        { status: 401 }
      );
    }

    // 管理者ロールチェック
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { message: "この操作には管理者権限が必要です。" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestId = Number(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { message: "無効な申請IDです。" },
        { status: 400 }
      );
    }

    const body: UpdateRequestBody = await request.json();
    const { action, rejectionReason } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { message: "無効な操作です。" },
        { status: 400 }
      );
    }

    // 申請を取得
    const [existingRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      return NextResponse.json(
        { message: "申請が見つかりません。" },
        { status: 404 }
      );
    }

    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { message: "この申請は既に処理済みです。" },
        { status: 400 }
      );
    }

    const adminId = Number(session.user.id);
    const now = new Date().toISOString();

    if (action === "approve") {
      // 承認処理
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
          return NextResponse.json(
            { message: "有給残高が不足しています。" },
            { status: 400 }
          );
        }

        // 使用日数を更新
        await db
          .update(leaveBalances)
          .set({
            usedDays: balance.usedDays + existingRequest.days,
            updatedAt: now,
          })
          .where(eq(leaveBalances.id, balance.id));
      }

      // 申請を承認
      await db
        .update(leaveRequests)
        .set({
          status: "approved",
          approvedBy: adminId,
          approvedAt: now,
          updatedAt: now,
        })
        .where(eq(leaveRequests.id, requestId));

      return NextResponse.json(
        { message: "申請を承認しました。" },
        { status: 200 }
      );
    } else {
      // 却下処理
      if (!rejectionReason || rejectionReason.trim() === "") {
        return NextResponse.json(
          { message: "却下理由を入力してください。" },
          { status: 400 }
        );
      }

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

      return NextResponse.json(
        { message: "申請を却下しました。" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Request update error:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
