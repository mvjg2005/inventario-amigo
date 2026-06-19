import { createFileRoute } from "@tanstack/react-router";
import { Package, Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MovementsTable } from "@/components/dashboard/MovementsTable";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { getDashboardKpisFn } from "./index.server";
import { formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockPyme — Panel de inventario" },
      { name: "description", content: "Sistema de gestión de inventario para pequeñas y medianas empresas." },
    ],
  }),
  loader: async () => {
    const kpis = await getDashboardKpisFn();
    return kpis;
  },
  component: DashboardPage,
});

function DashboardPage() {
  const kpis = Route.useLoaderData();

  // Formatear valor inventario con la moneda configurada
  const valorFormateado = formatMoney(kpis.valorInventario);

  // Calcular rotación: mostrar "0,0x" si es 0, sino con una decimal
  const rotacionStr = kpis.rotacionPromedio > 0
    ? `${kpis.rotacionPromedio.toFixed(1).replace(".", ",")}x`
    : "0,0x";

  // Tendencia de porcentaje de error: si es 0 es positivo, si hay errores es negativo
  const errorTrend = kpis.porcentajeError === 0 ? "up" : kpis.porcentajeError < 5 ? "neutral" : "down";

  return (
    <DashboardLayout title="Panel de control" description="Resumen general del inventario">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Productos totales"
          value={kpis.totalProductos.toLocaleString("es-BO")}
          delta={kpis.totalProductos === 0 ? "Sin productos aún" : `${kpis.totalProductos} productos registrados`}
          trend="up"
          icon={Package}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          title="Valor del inventario"
          value={valorFormateado}
          delta="Suma de precio × stock actual"
          trend="up"
          icon={Wallet}
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          title="Rotación este mes"
          value={rotacionStr}
          delta={`${kpis.rotacionPromedio > 0 ? "Salidas / stock total" : "Sin salidas este mes"}`}
          trend={kpis.rotacionPromedio >= 1 ? "up" : "neutral"}
          icon={RefreshCw}
          accent="bg-violet-50 text-violet-600"
        />
        <KpiCard
          title="Productos sin stock"
          value={`${kpis.porcentajeError}%`}
          delta={kpis.porcentajeError === 0 ? "Todo el inventario disponible ✓" : `${kpis.alertas.filter(a => a.severity === "out").length} sin existencias`}
          trend={errorTrend as any}
          icon={AlertCircle}
          accent="bg-amber-50 text-amber-600"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <TopProductsChart data={kpis.topProductos} />
          <MovementsTable data={kpis.movimientosRecientes} />
        </div>
        <AlertsPanel alerts={kpis.alertas} />
      </section>
    </DashboardLayout>
  );
}
