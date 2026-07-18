import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { loginFn } from "./login.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OceanBackground } from "@/components/auth/OceanBackground";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — StockPyme" },
      {
        name: "description",
        content: "Accede a StockPyme para gestionar el inventario de tu negocio.",
      },
    ],
  }),
  component: LoginPage,
});

function friendlyLoginError(message: string): string {
  const msg = message.toLowerCase();
  if (
    msg.includes("invalid login") ||
    msg.includes("invalid credentials") ||
    msg.includes("invalid_credentials")
  ) {
    return "Correo o contraseña incorrectos. Inténtalo de nuevo.";
  }
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
  }
  if (msg.includes("too many requests") || msg.includes("rate")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "No se pudo conectar con el servidor. Revisa tu conexión.";
  }
  return message || "Error al iniciar sesión";
}

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);

  const busy = loading || oauthBusy;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginFn({ data: { email: email.trim(), password } } as any);
      await router.invalidate();
      await router.navigate({ to: "/" });
    } catch (err: any) {
      setError(friendlyLoginError(err?.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

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
          <p className="mt-2 max-w-xs text-sm text-sky-50/90">
            Gestiona tu inventario con claridad y control
          </p>
        </div>

        <Card className="auth-glass border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <GoogleAuthButton
                disabled={busy}
                onBusyChange={setOauthBusy}
                onError={(msg) => {
                  if (msg) setError(friendlyLoginError(msg));
                  else setError("");
                }}
              />

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/70" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-white/90 px-2 text-muted-foreground">o con email</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-4 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  required
                  className="bg-white/80"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    to="/recuperar"
                    className="text-xs font-medium text-sky-700 hover:text-sky-900 hover:underline"
                    tabIndex={busy ? -1 : 0}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    required
                    minLength={6}
                    className="bg-white/80 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={busy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-border/60 pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/registro"
                  className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                >
                  Crear cuenta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-sky-100/70">
          © {new Date().getFullYear()} StockPyme · Inventario para pymes
        </p>
      </div>
    </div>
  );
}
