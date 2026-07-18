import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OceanBackground } from "@/components/auth/OceanBackground";
import {
  exchangeOAuthCodeOnce,
  getBrowserSupabase,
} from "@/lib/supabase-browser";
import { setOAuthSessionFn } from "./auth.callback.server";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Conectando con Google — StockPyme" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function completeOAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthError =
          params.get("error_description") ||
          params.get("error") ||
          params.get("error_code");

        if (oauthError) {
          throw new Error(decodeURIComponent(oauthError.replace(/\+/g, " ")));
        }

        const code = params.get("code");
        let accessToken: string | undefined;

        if (code) {
          // Un solo exchange aunque React Strict Mode monte dos veces
          accessToken = await exchangeOAuthCodeOnce(code);
        } else {
          // Flujo implícito / hash o sesión ya persistida
          const client = getBrowserSupabase();
          const {
            data: { session },
            error: sessionError,
          } = await client.auth.getSession();
          if (sessionError) throw sessionError;
          accessToken = session?.access_token;
        }

        if (!accessToken) {
          throw new Error(
            "No se pudo obtener la sesión de Google. Vuelve a intentarlo desde el login.",
          );
        }

        await setOAuthSessionFn({ data: { access_token: accessToken } } as any);

        if (cancelled) return;

        // Limpiar query de la URL y entrar a la app
        window.history.replaceState({}, document.title, "/auth/callback");
        await router.invalidate();
        await router.navigate({ to: "/" });
      } catch (err: any) {
        if (cancelled) return;
        const raw = err?.message || "";
        const message = raw.includes("PKCE code verifier")
          ? "La sesión de Google se interrumpió (código PKCE no encontrado). Vuelve a iniciar sesión con Google desde esta misma pestaña y sin borrar datos del navegador."
          : raw || "No se pudo completar el inicio de sesión con Google.";
        setError(message);
      }
    }

    completeOAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="ocean-scene flex min-h-screen items-center justify-center px-4 py-12">
      <OceanBackground />

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 shadow-lg shadow-sky-950/20 ring-1 ring-white/60">
            <Package2 className="h-7 w-7 text-sky-700" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            StockPyme
          </h1>
        </div>

        <Card className="auth-glass border-0">
          <CardHeader className="space-y-1 pb-2 text-center">
            <CardTitle className="text-xl">
              {error ? "Error con Google" : "Conectando…"}
            </CardTitle>
            <CardDescription>
              {error
                ? "No pudimos completar la autenticación"
                : "Estamos iniciando tu sesión con Google"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button asChild className="w-full">
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-sky-700" />
                <p className="text-sm">Un momento, por favor…</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
