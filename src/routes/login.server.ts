import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";

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
