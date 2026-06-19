import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getFacturasFn, createFacturaFn } from "./facturas.server";
import { imprimirFactura } from "@/lib/imprimirFactura";
import { getCurrencyLabel } from "@/lib/utils";

export const Route = createFileRoute("/facturas")({
  head: () => ({ meta: [{ title: "Facturas — StockPyme" }] }),
  loader: async () => {
    const data = await getFacturasFn();
    return data;
  },
  component: FacturasPage,
});

const TIPO_CAMBIO = 6.96;

function FacturasPage() {
  const router = useRouter();
  const facturas = Route.useLoaderData() as any[];
  const [currency, setCurrency] = useState<"BS" | "USD">(() => {
    return getCurrencyLabel() === "USD" ? "USD" : "BS";
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ cliente: "", total: "", estado: "Pendiente" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalInput = parseFloat(formData.total);
    if (isNaN(totalInput) || totalInput <= 0) {
      toast.error("El total debe ser un número válido mayor a 0");
      return;
    }
    // Siempre guardar en Bs internamente
    const total_bs = currency === "USD" ? totalInput * TIPO_CAMBIO : totalInput;

    setLoading(true);
    try {
      await createFacturaFn({
        data: {
          cliente: formData.cliente,
          total_bs,
          estado: formData.estado,
        },
      } as any);
      toast.success("Factura generada con éxito");
      setIsDialogOpen(false);
      setFormData({ cliente: "", total: "", estado: "Pendiente" });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Error al generar la factura");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (totalBs: number) => {
    if (currency === "USD") return `$${(totalBs / TIPO_CAMBIO).toFixed(2)}`;
    return `Bs ${Number(totalBs).toFixed(2)}`;
  };

  const totalMensual = facturas.reduce((acc, f) => acc + Number(f.total_bs), 0);

  return (
    <DashboardLayout title="Facturas" description="Gestión de facturación y ventas">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrency(currency === "BS" ? "USD" : "BS")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Mostrar en {currency === "BS" ? "Dólares (USD)" : "Bolivianos (Bs)"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const csvRows = ["Numero de Factura,Cliente,Fecha,Estado,Producto,Cantidad,Precio Unitario (Bs),Subtotal (Bs)"];
            
            facturas.forEach(f => {
              let detallesList: any[] = [];
              try {
                if (f.detalles) {
                  detallesList = typeof f.detalles === "string" ? JSON.parse(f.detalles) : f.detalles;
                }
              } catch (e) {
                console.error("Error parsing detalles", e);
              }
              
              if (Array.isArray(detallesList) && detallesList.length > 0) {
                detallesList.forEach(d => {
                  const prodNom = d.producto ? d.producto.replace(/"/g, '""') : "Desconocido";
                  const cant = d.cantidad || 0;
                  const prec = d.precio_unitario || 0;
                  const subt = d.subtotal || (cant * prec);
                  csvRows.push(`"${f.numero}","${f.cliente.replace(/"/g, '""')}","${f.fecha}","${f.estado}","${prodNom}",${cant},${prec.toFixed(2)},${subt.toFixed(2)}`);
                });
              } else {
                csvRows.push(`"${f.numero}","${f.cliente.replace(/"/g, '""')}","${f.fecha}","${f.estado}","Venta General",1,${Number(f.total_bs).toFixed(2)},${Number(f.total_bs).toFixed(2)}`);
              }
            });

            const csv = csvRows.join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "facturas_productos.csv";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Facturas con desglose de productos exportadas");
          }}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Factura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente / Razón Social</Label>
                <Input id="cliente" value={formData.cliente} onChange={(e) => setFormData({ ...formData, cliente: e.target.value })} required placeholder="Nombre del cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total ({currency})</Label>
                <Input id="total" type="number" step="0.01" min="0.01" value={formData.total} onChange={(e) => setFormData({ ...formData, total: e.target.value })} required placeholder={`Monto en ${currency}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Pagada">Pagada</SelectItem>
                    <SelectItem value="Anulada">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Generando..." : "Generar Factura"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalMensual)}</div>
            <p className="text-xs text-muted-foreground">Tasa de cambio: {TIPO_CAMBIO} Bs/USD</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facturas.filter(f => f.estado === "Pagada").length}</div>
            <p className="text-xs text-muted-foreground">De {facturas.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Cobro</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facturas.filter(f => f.estado === "Pendiente").length}</div>
            <p className="text-xs text-muted-foreground">Facturas por cobrar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="font-mono text-sm font-medium">{factura.numero}</TableCell>
                    <TableCell>{factura.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{factura.fecha}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(Number(factura.total_bs))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        factura.estado === "Pagada" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        factura.estado === "Anulada" ? "border-rose-200 bg-rose-50 text-rose-700" :
                        "border-amber-200 bg-amber-50 text-amber-700"
                      }>
                        {factura.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => imprimirFactura(factura)}>
                        Imprimir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {facturas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No hay facturas registradas. ¡Genera la primera!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
