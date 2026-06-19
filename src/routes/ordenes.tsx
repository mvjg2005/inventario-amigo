import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Download, ShoppingCart, Package } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn, formatMoney, getCurrencyLabel } from "@/lib/utils";
import { getOrdenesFn, createOrdenFn } from "./ordenes.server";

export const Route = createFileRoute("/ordenes")({
  head: () => ({ meta: [{ title: "Órdenes — StockPyme" }] }),
  loader: async () => {
    const data = await getOrdenesFn();
    return data;
  },
  component: OrdenesPage,
});

type Estado = "pendiente" | "recibida" | "cancelada" | "transito";

const label = {
  pendiente: "Pendiente",
  recibida: "Recibida",
  cancelada: "Cancelada",
  transito: "En tránsito",
} as const;

interface LineItem {
  producto: string;
  paquetes: number;      // cuántos paquetes
  unidadesPorPaquete: number; // unidades por paquete
  precioPorPaquete: number;  // precio por paquete en Bs
}

function calcSubtotal(item: LineItem) {
  return item.paquetes * item.precioPorPaquete;
}

function emptyLine(): LineItem {
  return { producto: "", paquetes: 1, unidadesPorPaquete: 1, precioPorPaquete: 0 };
}

function OrdenesPage() {
  const router = useRouter();
  const ordenes = Route.useLoaderData() as any[];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proveedor, setProveedor] = useState("");
  const [estado, setEstado] = useState("pendiente");
  const [lineas, setLineas] = useState<LineItem[]>([emptyLine()]);

  const isUsd = getCurrencyLabel() === "USD";
  const totalBs = lineas.reduce((acc, l) => acc + calcSubtotal(l) * (isUsd ? 6.96 : 1), 0);
  const totalItems = lineas.reduce((acc, l) => acc + l.paquetes * l.unidadesPorPaquete, 0);

  const updateLinea = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const addLinea = () => setLineas(prev => [...prev, emptyLine()]);
  const removeLinea = (idx: number) => setLineas(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setProveedor("");
    setEstado("pendiente");
    setLineas([emptyLine()]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor.trim()) { toast.error("Ingresa el nombre del proveedor"); return; }
    if (lineas.some(l => !l.producto.trim())) { toast.error("Todos los productos deben tener nombre"); return; }
    if (totalBs <= 0) { toast.error("El total de la orden debe ser mayor a 0"); return; }

    setLoading(true);
    try {
      const detalles = lineas.map(l => ({
        producto: l.producto,
        paquetes: l.paquetes,
        unidades_por_paquete: l.unidadesPorPaquete,
        total_unidades: l.paquetes * l.unidadesPorPaquete,
        precio_por_paquete: isUsd ? l.precioPorPaquete * 6.96 : l.precioPorPaquete,
        subtotal: isUsd ? calcSubtotal(l) * 6.96 : calcSubtotal(l),
      }));

      await createOrdenFn({
        data: {
          proveedor,
          items: totalItems,
          total: totalBs,
          estado,
          detalles,
        },
      } as any);

      toast.success("Orden de compra creada con éxito");
      setIsDialogOpen(false);
      resetForm();
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Error al crear la orden");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = ["N° Orden,Proveedor,Fecha,Estado,Producto,Paquetes,Unid. x Paquete,Total Unidades,Precio Paquete (Bs),Subtotal (Bs)"];
    ordenes.forEach(o => {
      let detallesList: any[] = [];
      try {
        if (o.detalles) detallesList = typeof o.detalles === "string" ? JSON.parse(o.detalles) : o.detalles;
      } catch { /* skip */ }
      const fecha = new Date(o.created_at).toLocaleDateString("es-BO");
      if (Array.isArray(detallesList) && detallesList.length > 0) {
        detallesList.forEach(d => {
          rows.push(`"${o.numero}","${o.proveedor}","${fecha}","${label[o.estado as Estado] ?? o.estado}","${d.producto}",${d.paquetes},${d.unidades_por_paquete},${d.total_unidades},${d.precio_por_paquete},${d.subtotal}`);
        });
      } else {
        rows.push(`"${o.numero}","${o.proveedor}","${fecha}","${label[o.estado as Estado] ?? o.estado}","(Sin detalle)",${o.items},1,${o.items},${Number(o.total).toFixed(2)},${Number(o.total).toFixed(2)}`);
      }
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ordenes_compra.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Órdenes exportadas con desglose");
  };

  return (
    <DashboardLayout title="Órdenes" description="Órdenes de compra a proveedores">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Nueva orden</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                Nueva Orden de Compra
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-5 mt-2">
              {/* Proveedor + Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="proveedor">Proveedor *</Label>
                  <Input
                    id="proveedor"
                    placeholder="Ej: Don Juan, PIL, Coca Cola S.A."
                    value={proveedor}
                    onChange={e => setProveedor(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado inicial</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="transito">En tránsito</SelectItem>
                      <SelectItem value="recibida">Recibida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Líneas de Producto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-amber-600" />
                    Productos comprados
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLinea}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Agregar producto
                  </Button>
                </div>

                {/* Cabecera de columnas */}
                <div className="grid grid-cols-[1fr_80px_80px_90px_32px] gap-2 text-[11px] font-medium text-muted-foreground px-1">
                  <span>Producto</span>
                  <span className="text-center">Paquetes</span>
                  <span className="text-center">Unid/Paq</span>
                  <span className="text-center">Precio Paq ({getCurrencyLabel()})</span>
                  <span />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {lineas.map((l, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_80px_90px_32px] gap-2 items-center rounded-lg border border-border bg-muted/10 px-2 py-2">
                      <Input
                        placeholder="Ej: Mayonesa Hellmann's"
                        className="h-8 text-sm"
                        value={l.producto}
                        onChange={e => updateLinea(idx, "producto", e.target.value)}
                        required
                      />
                      <Input
                        type="number" min="1" step="1"
                        className="h-8 text-sm text-center"
                        value={l.paquetes}
                        onChange={e => updateLinea(idx, "paquetes", parseInt(e.target.value) || 1)}
                      />
                      <Input
                        type="number" min="1" step="1"
                        className="h-8 text-sm text-center"
                        value={l.unidadesPorPaquete}
                        onChange={e => updateLinea(idx, "unidadesPorPaquete", parseInt(e.target.value) || 1)}
                      />
                      <Input
                        type="number" min="0" step="0.01"
                        className="h-8 text-sm text-center"
                        value={l.precioPorPaquete}
                        onChange={e => updateLinea(idx, "precioPorPaquete", parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => removeLinea(idx)}
                        disabled={lineas.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Subtotales por línea */}
                {lineas.some(l => l.producto.trim()) && (
                  <div className="space-y-1 rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs">
                    {lineas.filter(l => l.producto.trim()).map((l, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span className="font-medium text-foreground truncate max-w-[200px]">{l.producto}</span>
                        <span className="font-mono tabular-nums">
                          {l.paquetes} paq × {l.unidadesPorPaquete} u = {l.paquetes * l.unidadesPorPaquete} u · {isUsd ? `$${calcSubtotal(l).toFixed(2)}` : `Bs ${calcSubtotal(l).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Totales */}
              <div className="flex items-center justify-between text-sm font-semibold">
                <div className="space-y-0.5 text-muted-foreground text-xs">
                  <p>Total unidades: <span className="font-bold text-foreground">{totalItems}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">TOTAL ORDEN</p>
                  <p className="text-xl font-bold text-amber-700">{formatMoney(totalBs)}</p>
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                {loading ? "Guardando orden..." : "Guardar Orden de Compra"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de órdenes */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Orden</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total Unidades</TableHead>
                  <TableHead className="text-right">Total ({getCurrencyLabel()})</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((o) => {
                  let detallesList: any[] = [];
                  try {
                    if (o.detalles) detallesList = typeof o.detalles === "string" ? JSON.parse(o.detalles) : o.detalles;
                  } catch { /* skip */ }
                  const productosResumen = detallesList.length > 0
                    ? detallesList.map((d: any) => d.producto).join(", ")
                    : "—";

                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                      <TableCell className="font-medium">{o.proveedor}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={productosResumen}>
                        {productosResumen}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{o.items}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium font-mono">
                        {formatMoney(o.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "font-medium",
                          o.estado === "recibida" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                          o.estado === "transito" && "border-blue-200 bg-blue-50 text-blue-700",
                          o.estado === "pendiente" && "border-amber-200 bg-amber-50 text-amber-700",
                          o.estado === "cancelada" && "border-rose-200 bg-rose-50 text-rose-700",
                        )}>
                          {label[o.estado as Estado]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {ordenes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay órdenes registradas. ¡Crea la primera con el botón de arriba!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Vista detalle de última orden (con líneas de producto) */}
      {ordenes.length > 0 && (() => {
        const ultima = ordenes[0];
        let detallesList: any[] = [];
        try {
          if (ultima.detalles) detallesList = typeof ultima.detalles === "string" ? JSON.parse(ultima.detalles) : ultima.detalles;
        } catch { /* skip */ }
        if (detallesList.length === 0) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-amber-600" />
                Detalle de la última orden — {ultima.numero} ({ultima.proveedor})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Paquetes</TableHead>
                      <TableHead className="text-center">Unid/Paq</TableHead>
                      <TableHead className="text-center">Total Unid.</TableHead>
                      <TableHead className="text-right">Precio Paq ({getCurrencyLabel()})</TableHead>
                      <TableHead className="text-right">Subtotal ({getCurrencyLabel()})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detallesList.map((d: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{d.producto}</TableCell>
                        <TableCell className="text-center tabular-nums">{d.paquetes}</TableCell>
                        <TableCell className="text-center tabular-nums">{d.unidades_por_paquete}</TableCell>
                        <TableCell className="text-center tabular-nums font-medium">{d.total_unidades}</TableCell>
                        <TableCell className="text-right tabular-nums font-mono">{formatMoney(d.precio_por_paquete)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-amber-700 font-mono">
                          {formatMoney(d.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="text-right font-semibold">TOTAL ORDEN</TableCell>
                      <TableCell className="text-right font-bold text-amber-700 font-mono">
                        {formatMoney(ultima.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </DashboardLayout>
  );
}
