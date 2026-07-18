import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { getCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "auth_session";

export const getAuthSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const sessionCookie = getCookie(COOKIE_NAME);
  if (!sessionCookie) return null;

  // Sesiones demo antiguas ya no son válidas — forzar re-login real
  if (sessionCookie === "demo-session") return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(sessionCookie);

  if (error || !user) return null;
  return user;
});
