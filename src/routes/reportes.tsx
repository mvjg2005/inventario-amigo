import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, TrendingUp, Calendar, BarChart2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { toast } from "sonner";
import { useState } from "react";
import { getDashboardKpisFn } from "./index.server";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/reportes")({
  head: () => ({ meta: [{ title: "Reportes — StockPyme" }] }),
  loader: async () => {
    const kpis = await getDashboardKpisFn();
    return kpis;
  },
  component: ReportesPage,
});

const reportesDef = [
  { id: "inv", title: "Inventario mensual", desc: "Resumen valorizado por categoría", icon: FileText },
  { id: "rot", title: "Rotación de productos", desc: "Análisis de movimiento por SKU", icon: TrendingUp },
  { id: "com", title: "Compras y proveedores", desc: "Órdenes recibidas y pendientes", icon: Calendar },
  { id: "mer", title: "Mermas y ajustes", desc: "Diferencias y descuentos de inventario", icon: BarChart2 },
];

function ReportesPage() {
  const kpis = Route.useLoaderData();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (id: string, title: string) => {
    setDownloading(id);
    toast.info(`Generando ${title}...`);

    setTimeout(() => {
      setDownloading(null);

      // Generar contenido del reporte según el tipo
      const fecha = new Date().toLocaleDateString("es-BO");
      let contenido = `REPORTE: ${title.toUpperCase()}\nFecha: ${fecha}\n\n`;

      if (id === "inv") {
        const valorTotal = formatMoney(kpis.valorInventario);
        contenido += `RESUMEN DE INVENTARIO\n${"─".repeat(40)}\n`;
        contenido += `Total de productos: ${kpis.totalProductos}\n`;
        contenido += `Valor total del inventario: ${valorTotal}\n`;
        contenido += `Productos sin stock: ${kpis.alertas.filter(a => a.severity === "out").length}\n`;
        contenido += `Productos con stock bajo: ${kpis.alertas.filter(a => a.severity === "low").length}\n`;
      } else if (id === "rot") {
        contenido += `ROTACIÓN DE PRODUCTOS\n${"─".repeat(40)}\n`;
        contenido += `Rotación promedio del mes: ${kpis.rotacionPromedio}x\n\n`;
        contenido += `TOP PRODUCTOS MÁS VENDIDOS:\n`;
        kpis.topProductos.forEach((p, i) => {
          contenido += `  ${i + 1}. ${p.product} — ${p.ventas} unidades\n`;
        });
      } else if (id === "com") {
        contenido += `COMPRAS Y PROVEEDORES\n${"─".repeat(40)}\n`;
        contenido += `Ver sección Órdenes para el detalle completo.\n`;
      } else if (id === "mer") {
        contenido += `MERMAS Y AJUSTES\n${"─".repeat(40)}\n`;
        contenido += `Porcentaje de error/merma: ${kpis.porcentajeError}%\n`;
        contenido += `Productos afectados: ${kpis.alertas.length}\n`;
      }

      // Abrir ventana de impresión con el contenido
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(
          `<html><head><title>${title}</title>
          <style>body{font-family:monospace;padding:2rem;white-space:pre-wrap;}</style>
          </head><body>${contenido}</body></html>`
        );
        win.document.close();
        win.print();
        toast.success(`${title} listo para guardar como PDF`);
      }
    }, 1200);
  };

  const mesActual = new Date().toLocaleString("es-BO", { month: "long", year: "numeric" });

  return (
    <DashboardLayout title="Reportes" description="Genera y descarga reportes detallados con datos reales">
      <TopProductsChart data={kpis.topProductos} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportesDef.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3 text-base">{r.title}</CardTitle>
              <CardDescription>{r.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground capitalize">{mesActual}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(r.id, r.title)}
                disabled={downloading === r.id}
              >
                {downloading === r.id ? "Generando..." : <><Download className="mr-2 h-4 w-4" />PDF</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </DashboardLayout>
  );
}
