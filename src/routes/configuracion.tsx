import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UserAvatarFace } from "@/components/dashboard/UserMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Bell, Save, UserCircle, ImagePlus, Check } from "lucide-react";
import {
  CARTOON_AVATARS,
  fileToAvatarDataUrl,
  getDisplayName,
  loadStoredProfile,
  setAvatarChoice,
} from "@/lib/userProfile";
import { loadSystemPrefs, saveSystemPrefs, type SystemPrefs } from "@/lib/systemPrefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — StockPyme" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  // @ts-ignore
  const context = useRouteContext({ from: "__root__" }) as { user?: any };
  const user = context?.user;
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarTick, setAvatarTick] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [presetId, setPresetId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const stored = loadStoredProfile(user.id);
    setPresetId(stored.avatar?.type === "preset" ? stored.avatar.id : null);
  }, [user?.id]);

  type EmpresaConfig = {
    razon: string;
    nit: string;
    direccion: string;
    moneda: string;
    zonaHoraria: string;
  };

  const defaultEmpresa: EmpresaConfig = {
    razon: "StockPyme S.R.L.",
    nit: "1023456789",
    direccion: "Av. Arce 2345, La Paz",
    moneda: "Bs",
    zonaHoraria: "America/La_Paz",
  };

  // ─── Información de empresa ──────────────────────────────────────
  const [empresa, setEmpresa] = useState<EmpresaConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stockpyme_empresa");
      if (saved) {
        try {
          return { ...defaultEmpresa, ...JSON.parse(saved) };
        } catch (e) {
          console.error(e);
        }
      }
    }
    return defaultEmpresa;
  });

  // ─── Preferencias ────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<SystemPrefs>(() => loadSystemPrefs());

  const togglePref = (key: keyof SystemPrefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Guardar al instante para que el asistente IA y el panel reaccionen de inmediato
      saveSystemPrefs(next);
      return next;
    });
  };

  const handleGuardar = () => {
    localStorage.setItem("stockpyme_empresa", JSON.stringify(empresa));
    saveSystemPrefs(prefs);
    toast.success("Configuración guardada correctamente");
  };

  const applyPreset = (id: string) => {
    if (!user?.id) return;
    setAvatarChoice(user.id, { type: "preset", id });
    setPresetId(id);
    setAvatarTick((t) => t + 1);
    toast.success("Avatar actualizado");
  };

  const handleUploadPhoto = async (file: File | undefined) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarChoice(user.id, { type: "custom", dataUrl });
      setPresetId(null);
      setAvatarTick((t) => t + 1);
      toast.success("Foto de perfil guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <DashboardLayout title="Configuración" description="Preferencias generales del sistema">
      {/* ─── Mi perfil ─── */}
      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Mi perfil
            </CardTitle>
            <CardDescription>
              Quién eres en el sistema y cómo se ve tu foto en el círculo de la cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div key={avatarTick}>
                <UserAvatarFace user={user} size="lg" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">{getDisplayName(user)}</p>
                <p className="truncate text-sm text-muted-foreground" title={user.email}>
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Correo con el que iniciaste sesión
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block">Caricaturas de personajes</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {CARTOON_AVATARS.map((avatar) => {
                  const active = presetId === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => applyPreset(avatar.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors hover:bg-muted/60",
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border",
                      )}
                      title={avatar.label}
                    >
                      <img
                        src={avatar.src}
                        alt={avatar.label}
                        className="h-10 w-10 rounded-full"
                      />
                      {active && (
                        <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleUploadPhoto(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Procesando…" : "Subir mi foto"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (!user?.id) return;
                  setAvatarChoice(user.id, null);
                  setPresetId(null);
                  setAvatarTick((t) => t + 1);
                  toast.success("Avatar restablecido");
                }}
              >
                Quitar foto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="pr-4">
                <p className="text-sm font-medium">Validación de movimientos</p>
                <p className="text-xs text-muted-foreground">
                  Si está activa, el asistente IA (Stocky) muestra la ficha del movimiento y espera
                  tu clic en <strong>Registrar</strong> antes de guardar entradas o salidas.
                  Si está desactivada, registra al instante cuando el producto ya existe o ya
                  tiene precio.
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
