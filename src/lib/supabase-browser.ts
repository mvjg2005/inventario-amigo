import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let browserClient: SupabaseClient | null = null;

/**
 * Cliente de Supabase solo para el navegador (OAuth / PKCE).
 * No usar en el servidor: el code_verifier de Google vive en localStorage.
 *
 * detectSessionInUrl: false — el callback intercambia el code a mano.
 * Si queda en true, el SDK y el callback compiten y aparece
 * "PKCE code verifier not found in storage".
 */
export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabase solo puede usarse en el cliente");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
      },
    });
  }

  return browserClient;
}

/** URL de retorno tras OAuth (debe estar en Redirect URLs de Supabase). */
export function getOAuthRedirectUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

/**
 * Intercambia el code OAuth una sola vez (evita Strict Mode / doble useEffect).
 * El code_verifier se borra tras el primer exchange exitoso.
 */
let exchangeInFlight: Promise<string> | null = null;

export async function exchangeOAuthCodeOnce(code: string): Promise<string> {
  if (exchangeInFlight) return exchangeInFlight;

  exchangeInFlight = (async () => {
    const client = getBrowserSupabase();

    // Si un intento previo (p. ej. Strict Mode) ya creó la sesión, reutilizarla
    const {
      data: { session: existing },
    } = await client.auth.getSession();
    if (existing?.access_token) {
      return existing.access_token;
    }

    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const token = data.session?.access_token;
    if (!token) {
      throw new Error(
        "No se pudo obtener la sesión de Google. Vuelve a intentarlo desde el login.",
      );
    }
    return token;
  })().catch((err) => {
    exchangeInFlight = null;
    throw err;
  });

  return exchangeInFlight;
}
