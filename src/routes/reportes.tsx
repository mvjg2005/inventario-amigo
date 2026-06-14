import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, TrendingUp, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";

export const Route = createFileRoute("/reportes")({
  head: () => ({ meta: [{ title: "Reportes — StockPyme" }] }),
  component: ReportesPage,
});

const reportes = [
  { title: "Inventario mensual", desc: "Resumen valorizado por categoría", icon: FileText, date: "Mayo 2026" },
  { title: "Rotación de productos", desc: "Análisis de movimiento por SKU", icon: TrendingUp, date: "Mayo 2026" },
  { title: "Compras y proveedores", desc: "Órdenes recibidas y pendientes", icon: Calendar, date: "Mayo 2026" },
  { title: "Mermas y ajustes", desc: "Diferencias y descuentos de inventario", icon: FileText, date: "Mayo 2026" },
];

function ReportesPage() {
  return (
    <DashboardLayout title="Reportes" description="Genera y descarga reportes detallados">
      <TopProductsChart />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportes.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3 text-base">{r.title}</CardTitle>
              <CardDescription>{r.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{r.date}</span>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />PDF</Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </DashboardLayout>
  );
}
