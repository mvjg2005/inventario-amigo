import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "auth_session";

// @ts-ignore
export const loginFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const { email, password } = ctx.data;

  if (!email || !password) {
    throw new Error("Email y contraseña son requeridos");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password: String(password),
  });

  if (error) throw new Error(error.message);
  if (!data.session?.access_token) {
    throw new Error("No se pudo crear la sesión. Revisa tu email/contraseña.");
  }

  setCookie(COOKIE_NAME, data.session.access_token, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return { success: true, user: data.user };
});
