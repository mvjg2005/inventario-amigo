import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { getCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";
import { DEMO_USER, isDemoSession } from "@/lib/demoMode";

const COOKIE_NAME = "auth_session";

export const getAuthSessionFn = createServerFn({ method: "GET" }).handler(async () => {
    const sessionCookie = getCookie(COOKIE_NAME);
    if (!sessionCookie) return null;
    if (isDemoSession(sessionCookie)) return DEMO_USER;
    
    // verify the token
    const { data: { user }, error } = await supabase.auth.getUser(sessionCookie);
    
    if (error || !user) return null;
      
    return user;
  });
