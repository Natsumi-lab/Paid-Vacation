import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { employees, passwordResetTokens } from "@/lib/db/schema";

const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 12;

function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // バリデーション
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { message: "無効なリクエストです。" },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { message: "パスワードを入力してください。" },
        { status: 400 },
      );
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { message: `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください。` },
        { status: 400 },
      );
    }

    // トークンを検索
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "パスワードリセットのリンクが無効または期限切れです。" },
        { status: 400 },
      );
    }

    // 有効期限チェック
    if (isTokenExpired(resetToken.expiresAt)) {
      // 期限切れのトークンを削除
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, resetToken.id));

      return NextResponse.json(
        { message: "パスワードリセットのリンクが期限切れです。再度お試しください。" },
        { status: 400 },
      );
    }

    // パスワードをハッシュ化
    const passwordHash = await hash(password, BCRYPT_SALT_ROUNDS);

    // パスワードを更新
    await db
      .update(employees)
      .set({
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employees.id, resetToken.employeeId));

    // 使用済みトークンを削除
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.employeeId, resetToken.employeeId));

    console.log(`[Reset Password] Password reset successful for employee ID: ${resetToken.employeeId}`);

    return NextResponse.json({
      message: "パスワードが正常に変更されました。",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
}
