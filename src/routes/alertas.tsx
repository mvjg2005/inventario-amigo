import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AlertTriangle, PackageX, BellRing } from "lucide-react";
import { getDashboardKpisFn } from "./index.server";

export const Route = createFileRoute("/alertas")({
  head: () => ({ meta: [{ title: "Alertas — StockPyme" }] }),
  loader: async () => {
    const kpis = await getDashboardKpisFn();
    return kpis;
  },
  component: AlertasPage,
});

function AlertasPage() {
  const kpis = Route.useLoaderData();

  const sinStock = kpis.alertas.filter(a => a.severity === "out").length;
  const stockBajo = kpis.alertas.filter(a => a.severity === "low").length;
  const totalAlertas = kpis.alertas.length;

  return (
    <DashboardLayout title="Alertas" description="Productos que requieren atención inmediata">
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Alertas activas"
          value={totalAlertas.toString()}
          delta={totalAlertas === 0 ? "Todo el inventario OK ✓" : "Requieren atención"}
          trend={totalAlertas === 0 ? "up" : "neutral"}
          icon={BellRing}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          title="Stock bajo"
          value={stockBajo.toString()}
          delta={stockBajo === 0 ? "Sin productos en stock bajo" : `${stockBajo} producto${stockBajo > 1 ? "s" : ""} bajo mínimo`}
          trend={stockBajo === 0 ? "up" : "neutral"}
          icon={AlertTriangle}
          accent="bg-amber-50 text-amber-600"
        />
        <KpiCard
          title="Sin inventario"
          value={sinStock.toString()}
          delta={sinStock === 0 ? "Sin quiebres de stock ✓" : `${sinStock} producto${sinStock > 1 ? "s" : ""} agotado${sinStock > 1 ? "s" : ""}`}
          trend={sinStock === 0 ? "up" : "down" as any}
          icon={PackageX}
          accent="bg-rose-50 text-rose-600"
        />
      </section>

      <AlertsPanel alerts={kpis.alertas} />
    </DashboardLayout>
  );
}
