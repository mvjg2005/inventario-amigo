import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";
import { DEMO_SESSION_TOKEN, DEMO_USER, isDemoCredentials } from "@/lib/demoMode";

const COOKIE_NAME = "auth_session";

// @ts-ignore
export const loginFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
    const { email, password } = ctx.data;
    if (isDemoCredentials(email, password)) {
      setCookie(COOKIE_NAME, DEMO_SESSION_TOKEN, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7
      });

      return { success: true, user: DEMO_USER };
    }

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
