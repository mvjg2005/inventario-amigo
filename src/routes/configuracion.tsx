import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — StockPyme" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  return (
    <DashboardLayout title="Configuración" description="Preferencias generales del sistema">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de la empresa</CardTitle>
            <CardDescription>Datos que aparecen en los reportes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Razón social</Label><Input defaultValue="StockPyme S.R.L." /></div>
            <div className="space-y-2"><Label>NIT</Label><Input defaultValue="1023456789" /></div>
            <div className="space-y-2"><Label>Dirección</Label><Input defaultValue="Av. Arce 2345, La Paz" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Moneda</Label><Input defaultValue="Bs (Boliviano)" /></div>
              <div className="space-y-2"><Label>Zona horaria</Label><Input defaultValue="America/La_Paz" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
            <CardDescription>Comportamiento del sistema y notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Alertas de bajo inventario", desc: "Notificar cuando un producto baje del mínimo" },
              { label: "Reporte semanal por correo", desc: "Resumen cada lunes a las 8:00 am" },
              { label: "Validación de movimientos", desc: "Solicitar confirmación antes de registrar" },
              { label: "Modo multi-sucursal", desc: "Habilitar gestión por almacén" },
            ].map((p, i) => (
              <div key={p.label}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <Switch defaultChecked={i < 2} />
                </div>
                {i < 3 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Cambios guardados correctamente")}>Guardar cambios</Button>
      </div>
    </DashboardLayout>
  );
}
