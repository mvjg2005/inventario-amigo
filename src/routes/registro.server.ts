import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "auth_session";

// @ts-ignore
export const registerFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
    try {
      const { nombre, email, password } = ctx.data;
      
      // Validaciones básicas
      if (!nombre || !email || !password) {
        throw new Error("Todos los campos son requeridos");
      }
      
      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } }
      });
      
      if (error) {
        // Proporcionar mensajes más amigables
        if (error.message.includes("rate_limit") || error.message.includes("58")) {
          throw new Error("Por seguridad, debes esperar 60 segundos antes de intentar de nuevo");
        }
        throw new Error(error.message);
      }

      // Guardar sesión si se creó exitosamente
      if (data.session) {
        setCookie(COOKIE_NAME, data.session.access_token, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
      }

      return { 
        success: true, 
        user: data.user,
        message: "Cuenta creada exitosamente"
      };
    } catch (error: any) {
      throw new Error(error.message || "Error al registrar la cuenta");
    }
  });
