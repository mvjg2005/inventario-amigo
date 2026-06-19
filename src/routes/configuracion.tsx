import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Bell, Save } from "lucide-react";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — StockPyme" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  // ─── Información de empresa ──────────────────────────────────────
  const [empresa, setEmpresa] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stockpyme_empresa");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      razon: "StockPyme S.R.L.",
      nit: "1023456789",
      direccion: "Av. Arce 2345, La Paz",
      moneda: "Bs",
      zonaHoraria: "America/La_Paz",
    };
  });

  // ─── Preferencias ────────────────────────────────────────────────
  const [prefs, setPrefs] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stockpyme_prefs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      alertasBajoInventario: true,
      validacionMovimientos: false,
    };
  });

  const togglePref = (key: keyof typeof prefs) =>
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleGuardar = () => {
    // Persiste en localStorage como ejemplo funcional
    localStorage.setItem("stockpyme_empresa", JSON.stringify(empresa));
    localStorage.setItem("stockpyme_prefs", JSON.stringify(prefs));
    toast.success("Configuración guardada correctamente");
  };

  return (
    <DashboardLayout title="Configuración" description="Preferencias generales del sistema">
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ─── Información de empresa ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Información de la empresa
            </CardTitle>
            <CardDescription>Datos que aparecen en reportes y facturas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="razon">Razón social</Label>
              <Input
                id="razon"
                value={empresa.razon}
                onChange={e => setEmpresa(p => ({ ...p, razon: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nit">NIT / RUC</Label>
              <Input
                id="nit"
                value={empresa.nit}
                onChange={e => setEmpresa(p => ({ ...p, nit: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dir">Dirección</Label>
              <Input
                id="dir"
                value={empresa.direccion}
                onChange={e => setEmpresa(p => ({ ...p, direccion: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select
                  value={empresa.moneda}
                  onValueChange={v => setEmpresa(p => ({ ...p, moneda: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bs">Bs (Boliviano)</SelectItem>
                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zona horaria</Label>
                <Select
                  value={empresa.zonaHoraria}
                  onValueChange={v => setEmpresa(p => ({ ...p, zonaHoraria: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/La_Paz">America/La Paz</SelectItem>
                    <SelectItem value="America/Lima">America/Lima</SelectItem>
                    <SelectItem value="America/Santiago">America/Santiago</SelectItem>
                    <SelectItem value="America/Bogota">America/Bogotá</SelectItem>
                    <SelectItem value="America/Buenos_Aires">America/Buenos Aires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Preferencias ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Preferencias del sistema
            </CardTitle>
            <CardDescription>Comportamiento y notificaciones dentro de la app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Alertas de bajo inventario */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium">Alertas de bajo inventario</p>
                <p className="text-xs text-muted-foreground">
                  Muestra la campana y el panel de alertas cuando un producto baje del mínimo
                </p>
              </div>
              <Switch
                checked={prefs.alertasBajoInventario}
                onCheckedChange={() => togglePref("alertasBajoInventario")}
              />
            </div>
            <Separator />

            {/* Validación de movimientos */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium">Validación de movimientos</p>
                <p className="text-xs text-muted-foreground">
                  El asistente IA pedirá confirmación antes de registrar entradas o salidas de almacén
                </p>
              </div>
              <Switch
                checked={prefs.validacionMovimientos}
                onCheckedChange={() => togglePref("validacionMovimientos")}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button onClick={handleGuardar} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar cambios
        </Button>
      </div>
    </DashboardLayout>
  );
}
