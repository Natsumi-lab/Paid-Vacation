import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 認証が必要なルート
const protectedRoutes = ["/dashboard", "/requests", "/admin"];

// 認証済みユーザーがアクセスできないルート（ログインページなど）
const authRoutes = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
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
