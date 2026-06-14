import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/recuperar")({
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate email sending since we don't have an SMTP server
    setTimeout(() => {
      setEnviado(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Package2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">StockPyme</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar contraseña</CardTitle>
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
                  Hemos enviado un correo a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
                </p>
                <Button className="w-full mt-4" asChild>
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecover} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Enviar enlace de recuperación
                </Button>
              </form>
            )}
          </CardContent>
          {!enviado && (
            <CardFooter className="flex justify-center border-t p-4">
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Volver al inicio de sesión
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
