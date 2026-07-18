import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import { getCookie } from "@tanstack/react-start/server";

const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

const COOKIE_NAME = "auth_session";

/**
 * Cliente de Supabase autenticado con el JWT del usuario actual.
 * Necesario para que las políticas RLS evalúen auth.uid() correctamente.
 */
export function getAuthSupabase() {
  const sessionCookie = getCookie(COOKIE_NAME);
  if (!sessionCookie || sessionCookie === "demo-session") {
    return supabase;
  }

  return createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
    global: {
      headers: {
        Authorization: `Bearer ${sessionCookie}`,
      },
    },
  });
}

/**
 * Usuario autenticado en el servidor (Supabase real).
 * null si no hay sesión o la sesión es demo antigua.
 */
export async function getCurrentUser() {
  try {
    const sessionCookie = getCookie(COOKIE_NAME);
    if (!sessionCookie || sessionCookie === "demo-session") return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionCookie);

    if (error || !user) return null;
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * ID del usuario autenticado. Lanza si no hay sesión real de Supabase.
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado. Inicia sesión con tu cuenta real de Supabase.");
  }
  return user.id;
}
