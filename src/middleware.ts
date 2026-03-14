import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  apiLimiter,
  getIdentifier,
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Appliquer rate limiting sur toutes les routes API
  if (pathname.startsWith("/api/")) {
    const identifier = getIdentifier(request);
    const { success, remaining, reset } = await checkRateLimit(
      apiLimiter,
      identifier
    );

    if (!success) {
      return rateLimitResponse(remaining, reset);
    }
  }

  // Routes publiques
  const publicRoutes = ["/auth/login", "/auth/register", "/auth/error"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Obtenir le token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Rediriger vers login si non authentifié et route protégée
  if (!token && !isPublicRoute) {
    // Pour les routes API, retourner une erreur JSON au lieu de rediriger
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rediriger vers dashboard si authentifié et sur page de login
  if (token && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Extraction du tenant depuis le sous-domaine (pour production uniquement)
  const hostname = request.headers.get("host") || "";
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isVercelPreview = hostname.includes(".vercel.app");

  if (token && !isLocalhost && !isVercelPreview) {
    const parts = hostname.split(".");
    // Sous-domaine valide seulement si 3+ parties (ex: sdis13.mindsp.fr)
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== "www") {
        const tenantSlug = token.tenantSlug as string;
        if (subdomain !== tenantSlug) {
          const correctUrl = new URL(request.url);
          correctUrl.hostname = `${tenantSlug}.${parts.slice(1).join(".")}`;
          return NextResponse.redirect(correctUrl);
        }
      }
    }
  }

  // Ajouter les headers de tenant pour les requêtes API
  const response = NextResponse.next();
  if (token) {
    response.headers.set("x-tenant-id", token.tenantId as string);
    response.headers.set("x-tenant-slug", token.tenantSlug as string);
    response.headers.set("x-user-id", token.id as string);
    response.headers.set("x-user-role", token.role as string);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|manifest.json|offline|sw\\.js).*)",
  ],
};
