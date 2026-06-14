import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, LifeBuoy, MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/soporte")({
  head: () => ({ meta: [{ title: "Soporte Técnico — Inventario Amigo" }] }),
  component: SoportePage,
});

function SoportePage() {
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending message
    setTimeout(() => {
      setEnviado(true);
      setMensaje("");
    }, 1000);
  };

  return (
    <DashboardLayout title="Soporte Técnico" description="¿Necesitas ayuda? Estamos aquí para asistirte.">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Contacto Directo
            </CardTitle>
            <CardDescription>Envíanos tu consulta y te responderemos a la brevedad.</CardDescription>
          </CardHeader>
          <CardContent>
            {enviado ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600">
                  <Send className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-medium">¡Mensaje enviado!</h3>
                <p className="text-sm text-muted-foreground">
                  Hemos recibido tu consulta. Nuestro equipo de soporte te contactará pronto.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setEnviado(false)}>
                  Enviar otro mensaje
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asunto">Asunto</Label>
                  <Input id="asunto" placeholder="Ej: Problema con la facturación" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <textarea 
                    id="mensaje" 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe detalladamente tu consulta o problema..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" /> Enviar Mensaje
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-background p-4 shadow-sm">
              <h4 className="font-medium">¿Cómo añado un nuevo producto?</h4>
              <p className="mt-1 text-sm text-muted-foreground">Ve a la sección "Productos" y haz clic en el botón superior derecho "Nuevo producto".</p>
            </div>
            <div className="rounded-lg bg-background p-4 shadow-sm">
              <h4 className="font-medium">¿Puedo exportar mi inventario?</h4>
              <p className="mt-1 text-sm text-muted-foreground">Sí, puedes exportar todo tu catálogo en formato CSV desde la vista de Productos usando el botón "Exportar".</p>
            </div>
            <div className="rounded-lg bg-background p-4 shadow-sm">
              <h4 className="font-medium">¿Cómo vinculo Supabase?</h4>
              <p className="mt-1 text-sm text-muted-foreground">Asegúrate de agregar tu URL de proyecto y ANON KEY en el archivo .env en la raíz del proyecto.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
