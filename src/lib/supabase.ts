import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import { getCookie } from "@tanstack/react-start/server";
import { DEMO_USER, DEMO_USER_ID, isDemoSession } from "./demoMode";

const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const COOKIE_NAME = "auth_session";

/**
 * Obtiene un cliente de Supabase autenticado con el token del usuario actual
 * Esto es crucial para que las políticas RLS (Row Level Security) funcionen,
 * ya que Postgres necesita el JWT para evaluar auth.uid()
 */
export function getAuthSupabase() {
  const sessionCookie = getCookie(COOKIE_NAME);
  if (!sessionCookie) return supabase; // Fallback al anónimo

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${sessionCookie}`
      }
    }
  });
}

/**
 * Obtiene el usuario actual autenticado en el servidor
 * Retorna null si no hay usuario autenticado
 */
export async function getCurrentUser() {
  try {
    const sessionCookie = getCookie(COOKIE_NAME);
    if (!sessionCookie) return null;
    if (isDemoSession(sessionCookie)) return DEMO_USER as any;
    
    const { data: { user }, error } = await supabase.auth.getUser(sessionCookie);
    
    if (error || !user) return null;
    
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Obtiene el ID del usuario actual
 * Lanza error si no hay usuario autenticado
 */
export async function getCurrentUserId(): Promise<string> {
  const sessionCookie = getCookie(COOKIE_NAME);
  if (isDemoSession(sessionCookie)) return DEMO_USER_ID;

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }
  return user.id;
}
