import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { employees, passwordResetTokens } from "@/lib/db/schema";

const TOKEN_EXPIRY_HOURS = 1;

function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

function getExpiryDate(): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + TOKEN_EXPIRY_HOURS);
  return expiry.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "メールアドレスを入力してください。" },
        { status: 400 },
      );
    }

    const employee = await db.query.employees.findFirst({
      where: eq(employees.email, email.trim().toLowerCase()),
    });

    // セキュリティ: ユーザーが存在しなくても同じレスポンスを返す
    if (!employee) {
      console.log(`[Forgot Password] Email not found: ${email}`);
      return NextResponse.json({
        message: "リセットリンクを送信しました。",
      });
    }

    // 既存のトークンを削除
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.employeeId, employee.id));

    // 新しいトークンを生成
    const token = generateResetToken();
    const expiresAt = getExpiryDate();

    await db.insert(passwordResetTokens).values({
      employeeId: employee.id,
      token,
      expiresAt,
    });

    // 本番環境ではここでメール送信
    // 開発環境ではコンソールに出力
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    console.log(`[Forgot Password] Reset URL for ${email}: ${resetUrl}`);

    return NextResponse.json({
      message: "リセットリンクを送信しました。",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
}
