import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ordenes")({
  head: () => ({ meta: [{ title: "Órdenes — StockPyme" }] }),
  component: OrdenesPage,
});

type Estado = "pendiente" | "recibida" | "cancelada" | "transito";
const ordenes: { id: string; proveedor: string; fecha: string; total: number; items: number; estado: Estado }[] = [
  { id: "OC-1042", proveedor: "Distribuidora La Paz", fecha: "30 May 2026", total: 12450, items: 24, estado: "recibida" },
  { id: "OC-1041", proveedor: "Comercial Andina", fecha: "29 May 2026", total: 8320, items: 15, estado: "transito" },
  { id: "OC-1040", proveedor: "Importadora Sur", fecha: "28 May 2026", total: 5670, items: 9, estado: "pendiente" },
  { id: "OC-1039", proveedor: "Distribuidora La Paz", fecha: "26 May 2026", total: 14210, items: 32, estado: "recibida" },
  { id: "OC-1038", proveedor: "Mayorista Central", fecha: "24 May 2026", total: 3210, items: 6, estado: "cancelada" },
];

const label = { pendiente: "Pendiente", recibida: "Recibida", cancelada: "Cancelada", transito: "En tránsito" } as const;

function OrdenesPage() {
  return (
    <DashboardLayout title="Órdenes" description="Órdenes de compra a proveedores">
      <div className="flex items-center justify-end">
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Nueva orden</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Ítems</TableHead>
                <TableHead className="text-right">Total (Bs)</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenes.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.proveedor}</TableCell>
                  <TableCell className="text-muted-foreground">{o.fecha}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.items}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.total.toLocaleString("es-BO")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-medium",
                      o.estado === "recibida" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                      o.estado === "transito" && "border-blue-200 bg-blue-50 text-blue-700",
                      o.estado === "pendiente" && "border-amber-200 bg-amber-50 text-amber-700",
                      o.estado === "cancelada" && "border-rose-200 bg-rose-50 text-rose-700",
                    )}>{label[o.estado]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
