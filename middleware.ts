import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidToken } from "@/lib/auth";

/**
 * Protege todas las rutas excepto /login y assets estáticos.
 * La sesión es una cookie con el hash del PIN (ver lib/auth.ts).
 */
export async function middleware(request: NextRequest) {
  // BYPASS SOLO PARA DESARROLLO: permitir acceso sin autenticación
  if (process.env.NODE_ENV === "development") {
    const isLoginRoute = request.nextUrl.pathname.startsWith("/login");
    if (isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const authed = await isValidToken(token);
  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  // Sin sesión y fuera de /login -> a /login.
  if (!authed && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión en /login -> al inicio.
  if (authed && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protege todo excepto assets estáticos.
     * La lógica de /login vive arriba.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
