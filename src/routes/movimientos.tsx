import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MovementsTable, type Movement } from "@/components/dashboard/MovementsTable";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMovimientosFn, createMovimientoFn } from "./movimientos.server";
import { createProductFn, getProductsFn } from "./productos.server";

export const Route = createFileRoute("/movimientos")({
  head: () => ({ meta: [{ title: "Movimientos — StockPyme" }] }),
  loader: async () => {
    const data = await getMovimientosFn();
    return data;
  },
  component: MovimientosPage,
});

function MovimientosPage() {
  const router = useRouter();
  const rawData = Route.useLoaderData() as any[];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ producto: "", sku: "", tipo: "entrada", cantidad: "" });

  // Mapear datos de BD al formato que espera MovementsTable
  const data: Movement[] = rawData.map((m) => ({
    id: `MV-${m.id}`,
    product: m.producto,
    sku: m.sku,
    type: m.tipo as "entrada" | "salida",
    qty: m.cantidad,
    date: new Date(m.created_at).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" }),
    stock: "normal" as const,
  }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantidad = parseInt(formData.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    setLoading(true);
    try {
      await createMovimientoFn({
        data: { producto: formData.producto, sku: formData.sku, tipo: formData.tipo, cantidad },
      } as any);
      toast.success("Movimiento registrado con éxito");
      setIsDialogOpen(false);
      setFormData({ producto: "", sku: "", tipo: "entrada", cantidad: "" });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };


  const entradas = rawData.filter((d) => d.tipo === "entrada").reduce((acc, curr) => acc + curr.cantidad, 0);
  const salidas = rawData.filter((d) => d.tipo === "salida").reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <DashboardLayout title="Movimientos" description="Historial de entradas y salidas del almacén">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Todos los movimientos registrados</p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Registrar movimiento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar nuevo movimiento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Movimiento</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required placeholder="Ej: ACV-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="producto">Nombre del Producto</Label>
                <Input id="producto" value={formData.producto} onChange={(e) => setFormData({ ...formData, producto: e.target.value })} required placeholder="Ej: Aceite vegetal 1L" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input id="cantidad" type="number" min="1" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Registrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Entradas" value={entradas.toString()} delta="Total acumulado" trend="up" icon={ArrowDownLeft} accent="bg-emerald-50 text-emerald-600" />
        <KpiCard title="Salidas" value={salidas.toString()} delta="Total acumulado" trend="up" icon={ArrowUpRight} accent="bg-rose-50 text-rose-600" />
        <KpiCard title="Total Movimientos" value={rawData.length.toString()} delta="Registrados" trend="neutral" icon={Repeat} accent="bg-blue-50 text-blue-600" />
      </section>

      <MovementsTable data={data} />
    </DashboardLayout>
  );
}
