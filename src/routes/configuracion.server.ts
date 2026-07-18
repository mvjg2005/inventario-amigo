import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { getCookie } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "auth_session";

function getSupabaseEnv() {
  const url =
    process.env.VITE_SUPABASE_URL ||
    (typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_SUPABASE_URL
      : undefined);
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    (typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
      : undefined);

  if (!url || !anonKey) {
    throw new Error("Falta la configuración de Supabase en el servidor");
  }
  return { url: String(url), anonKey: String(anonKey) };
}

/**
 * Actualiza el nombre visible del usuario (user_metadata).
 * El correo de inicio de sesión no se modifica.
 */
// @ts-ignore
export const updateDisplayNameFn = createServerFn({ method: "POST" }).handler(
  async (ctx: any) => {
    const sessionCookie = getCookie(COOKIE_NAME);
    if (!sessionCookie || sessionCookie === "demo-session") {
      throw new Error("Debes iniciar sesión para cambiar tu nombre");
    }

    const nombre = String(ctx?.data?.nombre ?? "").trim();
    if (nombre.length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }
    if (nombre.length > 80) {
      throw new Error("El nombre no puede superar 80 caracteres");
    }

    // Confirmar que el token sigue siendo válido
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user: current },
      error: userError,
    } = await supabase.auth.getUser(sessionCookie);

    if (userError || !current) {
      throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    }

    // Actualizar metadata con el JWT del usuario (API Auth de Supabase)
    const res = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${sessionCookie}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          nombre,
          // Mantener coherencia con login Google y getDisplayName()
          full_name: nombre,
          name: nombre,
        },
      }),
    });

    if (!res.ok) {
      let message = "No se pudo actualizar el nombre";
      try {
        const body = (await res.json()) as {
          msg?: string;
          error_description?: string;
          message?: string;
        };
        message =
          body.msg || body.error_description || body.message || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    const updated = (await res.json()) as {
      email?: string;
    };

    return {
      success: true as const,
      nombre,
      email: String(updated.email ?? current.email ?? ""),
    };
  },
);
