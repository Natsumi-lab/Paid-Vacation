import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { leaveRequests } from "@/lib/db/schema";

type LeaveType = "full" | "am_half" | "pm_half";

type CreateLeaveRequestBody = {
  requestDate: string;
  leaveType: LeaveType;
  days: number;
  reason: string | null;
};

function isValidLeaveType(value: unknown): value is LeaveType {
  return value === "full" || value === "am_half" || value === "pm_half";
}

function isValidDays(days: unknown, leaveType: LeaveType): boolean {
  if (typeof days !== "number") return false;
  if (leaveType === "full") return days === 1;
  return days === 0.5;
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function isFutureOrToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です。" },
        { status: 401 }
      );
    }

    const body: CreateLeaveRequestBody = await request.json();
    const { requestDate, leaveType, days, reason } = body;

    // バリデーション
    if (!requestDate || typeof requestDate !== "string") {
      return NextResponse.json(
        { message: "日付を入力してください。" },
        { status: 400 }
      );
    }

    if (!isValidDate(requestDate)) {
      return NextResponse.json(
        { message: "有効な日付を入力してください。" },
        { status: 400 }
      );
    }

    if (!isFutureOrToday(requestDate)) {
      return NextResponse.json(
        { message: "過去の日付は選択できません。" },
        { status: 400 }
      );
    }

    if (!isValidLeaveType(leaveType)) {
      return NextResponse.json(
        { message: "有効な休暇種類を選択してください。" },
        { status: 400 }
      );
    }

    if (!isValidDays(days, leaveType)) {
      return NextResponse.json(
        { message: "日数が正しくありません。" },
        { status: 400 }
      );
    }

    const employeeId = Number(session.user.id);

    // 有給申請を作成
    await db.insert(leaveRequests).values({
      employeeId,
      requestDate,
      leaveType,
      days,
      reason: reason || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "申請が完了しました。" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Leave request creation error:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
