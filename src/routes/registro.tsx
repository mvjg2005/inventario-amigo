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

function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);

  const busy = loading || oauthBusy || success;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await registerFn({ data: { nombre: nombre.trim(), email: email.trim(), password } } as any);
      setSuccess(true);
      setNombre("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        router.navigate({ to: "/" });
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.message || "Error al registrar la cuenta";

      if (errorMsg.includes("rate_limit") || errorMsg.includes("58 seconds")) {
        setError("Espera 60 segundos antes de intentar de nuevo con este email.");
      } else if (
        errorMsg.includes("already exists") ||
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

  return (
    <div className="ocean-scene flex min-h-screen items-center justify-center px-4 py-12">
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
            {success && (
              <Alert className="mb-4 border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  Cuenta creada exitosamente. Redirigiendo…
                </AlertDescription>
              </Alert>
            )}

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
