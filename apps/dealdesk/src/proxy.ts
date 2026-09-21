import { NextResponse, type NextProxy } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { env } from "@/lib/env";

/**
 * Next 16 renamed `middleware` to `proxy`. Runs on the Node runtime only.
 *
 * Clerk's session handling needs to run here for `auth()` to work in server
 * components, so we mount it when configured. When Clerk is absent (local
 * development against the dev auth bypass) this is a pass-through, and the
 * session check happens in the (app) layout instead.
 *
 * clerkMiddleware() is constructed lazily inside the guard because it throws
 * when keys are missing.
 */
const clerkProxy = env.clerk.configured() ? clerkMiddleware() : null;

export const proxy: NextProxy = (request, event) => {
  if (clerkProxy) return clerkProxy(request, event);
  return NextResponse.next();
};

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
