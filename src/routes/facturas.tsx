import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/facturas")({
  head: () => ({ meta: [{ title: "Facturas — Inventario Amigo" }] }),
  component: FacturasPage,
});

const mockFacturas = [
  { id: "F-001", cliente: "Tech Solutions S.A.", total: 1500.50, fecha: "2026-06-05", estado: "Pagada" },
  { id: "F-002", cliente: "Comercial del Sur", total: 320.00, fecha: "2026-06-04", estado: "Pendiente" },
  { id: "F-003", cliente: "Importadora ABC", total: 4500.00, fecha: "2026-06-01", estado: "Pagada" },
];

function FacturasPage() {
  return (
    <DashboardLayout title="Facturas" description="Gestión de facturación y ventas">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Nueva Factura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación del Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$6,320.50</div>
            <p className="text-xs text-muted-foreground">+20.1% respecto al mes anterior</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {mockFacturas.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell className="font-mono text-sm font-medium">{factura.id}</TableCell>
                  <TableCell>{factura.cliente}</TableCell>
                  <TableCell className="text-muted-foreground">{factura.fecha}</TableCell>
                  <TableCell className="text-right tabular-nums">${factura.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      factura.estado === "Pagada" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                    }>
                      {factura.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Ver PDF</Button>
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
