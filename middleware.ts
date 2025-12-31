import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
