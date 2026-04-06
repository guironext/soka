import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

function readSokaStatus(sessionClaims: unknown): string | undefined {
  if (!sessionClaims || typeof sessionClaims !== "object") return undefined;
  const c = sessionClaims as Record<string, unknown>;
  return (
    (typeof c.sokaStatus === "string" ? c.sokaStatus : undefined) ??
    (typeof c.metadata === "object" &&
    c.metadata !== null &&
    typeof (c.metadata as Record<string, unknown>).sokaStatus === "string"
      ? ((c.metadata as Record<string, unknown>).sokaStatus as string)
      : undefined)
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (req.nextUrl.pathname.startsWith("/api/webhooks/")) {
      return NextResponse.next();
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const status = readSokaStatus(sessionClaims);

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (req.nextUrl.pathname.startsWith("/onboarding")) {
    if (status === "ACTIVE") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
