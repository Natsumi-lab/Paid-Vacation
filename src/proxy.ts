import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 認証が必要なルート
const protectedRoutes = ["/dashboard", "/requests", "/admin"];

// 管理者のみアクセス可能なルート
const adminRoutes = ["/admin"];

// 認証済みユーザーがアクセスできないルート（ログインページなど）
const authRoutes = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // 認証が必要なルートに未認証でアクセスした場合
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理者ルートに非管理者がアクセスした場合
  if (isAdminRoute && isLoggedIn && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 認証済みユーザーがログインページにアクセスした場合
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // 認証チェックが必要なルートのみマッチ
    "/dashboard/:path*",
    "/requests/:path*",
    "/admin/:path*",
    "/login",
  ],
};
