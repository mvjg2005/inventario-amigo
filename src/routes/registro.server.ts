import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { setCookie } from "@tanstack/react-start/server";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "auth_session";

// @ts-ignore
export const registerFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  try {
    const { nombre, email, password, emailRedirectTo } = ctx.data ?? {};

    if (!nombre || !email || !password) {
      throw new Error("Todos los campos son requeridos");
    }

    if (String(password).length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanNombre = String(nombre).trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: String(password),
      options: {
        data: { nombre: cleanNombre },
        // Tras confirmar el correo, volver al login (evita 404 por redirect mal configurado)
        emailRedirectTo:
          typeof emailRedirectTo === "string" && emailRedirectTo
            ? emailRedirectTo
            : undefined,
      },
    });

    if (error) {
      if (error.message.includes("rate_limit") || error.message.includes("58")) {
        throw new Error(
          "Por seguridad, debes esperar 60 segundos antes de intentar de nuevo",
        );
      }
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
      ) {
        throw new Error(
          "Este email ya está registrado. Inicia sesión con tu correo y contraseña.",
        );
      }
      throw new Error(error.message);
    }

    // Supabase a veces “crea” un usuario fantasma si el email ya existe (sin identidades)
    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      throw new Error(
        "Este email ya está registrado. Inicia sesión con tu correo y contraseña.",
      );
    }

    // Si Supabase devuelve sesión (confirmación de email desactivada), entrar al sistema
    if (data.session?.access_token) {
      setCookie(COOKIE_NAME, data.session.access_token, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      });

      return {
        success: true,
        sessionCreated: true,
        needsEmailConfirmation: false,
        email: cleanEmail,
        message: "Cuenta creada. Entrando al sistema…",
      };
    }

    // Sin sesión: hay que confirmar correo o volver a iniciar sesión
    return {
      success: true,
      sessionCreated: false,
      needsEmailConfirmation: true,
      email: cleanEmail,
      message:
        "Cuenta creada. Vuelve a iniciar sesión con el correo que registraste.",
    };
  } catch (error: any) {
    throw new Error(error.message || "Error al registrar la cuenta");
  }
});
