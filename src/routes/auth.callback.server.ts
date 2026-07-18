import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "auth_session";

/**
 * Establece la cookie httpOnly tras un login OAuth (Google).
 * El access_token ya fue obtenido en el navegador vía PKCE.
 */
// @ts-ignore
export const setOAuthSessionFn = createServerFn({ method: "POST" }).handler(
  async (ctx: any) => {
    const accessToken = String(ctx?.data?.access_token ?? "").trim();

    if (!accessToken) {
      throw new Error("No se recibió el token de sesión de Google.");
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      throw new Error(
        error?.message || "La sesión de Google no es válida o expiró. Inténtalo de nuevo.",
      );
    }

    setCookie(COOKIE_NAME, accessToken, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 semana (mismo criterio que login email)
      sameSite: "lax",
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  },
);
