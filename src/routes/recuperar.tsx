import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { Package2, CheckCircle2, Loader2 } from "lucide-react";
import { OceanBackground } from "@/components/auth/OceanBackground";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — StockPyme" },
      {
        name: "description",
        content: "Restablece tu contraseña de StockPyme.",
      },
    ],
  }),
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación: aún no hay SMTP / reset real conectado
    setTimeout(() => {
      setEnviado(true);
      setLoading(false);
    }, 1000);
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
        </div>

        <Card className="auth-glass border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              {enviado
                ? "Revisa tu bandeja de entrada"
                : "Te enviaremos un enlace para restablecer tu contraseña"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enviado ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  Si existe una cuenta con{" "}
                  <strong className="text-foreground">{email}</strong>, recibirás
                  instrucciones para restablecer tu contraseña.
                </p>
                <Button className="mt-2 w-full" asChild>
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecover} className="space-y-4" noValidate>
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
                    disabled={loading}
                    required
                    className="bg-white/80"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          {!enviado && (
            <CardFooter className="flex justify-center border-t border-border/60 p-4">
              <Link
                to="/login"
                className="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
