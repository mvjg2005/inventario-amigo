import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie, getCookie, deleteCookie } from "@tanstack/react-start/server";
import { supabase } from "../lib/supabase";

const COOKIE_NAME = "auth_session";

// @ts-ignore
export const loginFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const { email, password } = ctx.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);

  // Save session in cookie
  setCookie(COOKIE_NAME, data.session.access_token, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  return { success: true, user: data.user };
});

// @ts-ignore
export const registerFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const { nombre, email, password } = ctx.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } }
  });

  if (error) throw new Error(error.message);

  if (data.session) {
    setCookie(COOKIE_NAME, data.session.access_token, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
  }

  return { success: true, user: data.user };
});

export const logoutFn = createServerFn({ method: "POST" })
  .handler(async () => {
    deleteCookie(COOKIE_NAME);
    return { success: true };
  });

export const getAuthSessionFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const sessionCookie = getCookie(COOKIE_NAME);
    if (!sessionCookie) return null;

    // verify the token
    const { data: { user }, error } = await supabase.auth.getUser(sessionCookie);

    if (error || !user) return null;

    return user;
  });
