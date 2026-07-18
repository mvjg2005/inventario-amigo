import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { registerFn } from "./registro.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  LogIn,
} from "lucide-react";
import { OceanBackground } from "@/components/auth/OceanBackground";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — StockPyme" },
      {
        name: "description",
        content: "Regístrate en StockPyme y empieza a gestionar tu inventario.",
      },
    ],
  }),
  component: RegistroPage,
});

type RegisterResult = {
  success: boolean;
  sessionCreated?: boolean;
  needsEmailConfirmation?: boolean;
  email?: string;
  message?: string;
};

function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  /** Pantalla post-registro: ir a login con el correo (no redirigir a / y 404/sesión vacía) */
  const [done, setDone] = useState<{ email: string; needsConfirm: boolean } | null>(
    null,
  );

  const busy = loading || oauthBusy || Boolean(done);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const result = (await registerFn({
        data: {
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          emailRedirectTo,
        },
      } as any)) as RegisterResult;

      // Entrada directa al sistema si Supabase creó sesión
      if (result.sessionCreated) {
        await router.invalidate();
        await router.navigate({ to: "/productos" });
        return;
      }

      // Sin sesión: mostrar pantalla clara (no navegar a / → evita 404 / bucle raro)
      setDone({
        email: result.email || email.trim(),
        needsConfirm: Boolean(result.needsEmailConfirmation),
      });
      setPassword("");
    } catch (err: any) {
      const errorMsg = err.message || "Error al registrar la cuenta";

      if (errorMsg.includes("rate_limit") || errorMsg.includes("58 seconds") || errorMsg.includes("60 segundos")) {
        setError("Espera 60 segundos antes de intentar de nuevo con este email.");
      } else if (
        errorMsg.includes("already") ||
        errorMsg.includes("ya está registrado") ||
        errorMsg.includes("User already registered")
      ) {
        setError("Este email ya está registrado. Usa otro email o inicia sesión.");
      } else if (errorMsg.toLowerCase().includes("invalid email")) {
        setError("El formato del email no es válido.");
      } else if (errorMsg.toLowerCase().includes("password")) {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Pantalla de éxito: volver a iniciar sesión ─────────────────────────
  if (done) {
    return (
      <div className="ocean-scene flex min-h-dvh items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <OceanBackground />

        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 shadow-lg shadow-sky-950/20 ring-1 ring-white/60">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              ¡Cuenta creada!
            </h1>
            <p className="mt-2 max-w-sm text-sm text-sky-50/90">
              Ya puedes entrar al sistema con el correo que registraste.
            </p>
          </div>

          <Card className="auth-glass border-0">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xl">Siguiente paso</CardTitle>
              <CardDescription>
                Vuelve a iniciar sesión con tus datos de registro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50">
                <Mail className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-900">
                  <span className="font-medium">Correo registrado:</span>
                  <br />
                  <span className="break-all font-semibold">{done.email}</span>
                </AlertDescription>
              </Alert>

              {done.needsConfirm && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Si tu proyecto pide confirmación de email, revisa también tu bandeja de
                  entrada (y spam). Cuando confirmes, o si ya puedes entrar sin confirmar,
                  usa el botón de abajo con la misma contraseña.
                </p>
              )}

              <Button asChild className="w-full gap-2">
                <Link
                  to="/login"
                  search={{ email: done.email, registered: "1" } as any}
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar sesión con este correo
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/60 p-4">
              <p className="text-sm text-muted-foreground">
                ¿Problemas?{" "}
                <Link
                  to="/login"
                  className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                >
                  Ir al inicio de sesión
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="ocean-scene flex min-h-dvh items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <OceanBackground />

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 shadow-lg shadow-sky-950/20 ring-1 ring-white/60">
            <Package2 className="h-7 w-7 text-sky-700" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            Crea tu cuenta
          </h1>
          <p className="mt-2 max-w-xs text-sm text-sky-50/90">
            Empieza a gestionar tu negocio con StockPyme
          </p>
        </div>

        <Card className="auth-glass border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Registro</CardTitle>
            <CardDescription>
              Ingresa tus datos para empezar a gestionar tu inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mb-4 space-y-4">
              <GoogleAuthButton
                disabled={busy}
                label="Registrarse con Google"
                onBusyChange={setOauthBusy}
                onError={(msg) => {
                  if (msg) setError(msg);
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

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  name="name"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={busy}
                  required
                  className="bg-white/80"
                />
              </div>
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
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
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
              <Button type="submit" className="w-full" disabled={busy}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta…
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/60 p-4">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
