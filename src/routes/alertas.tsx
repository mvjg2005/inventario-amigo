import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AlertTriangle, PackageX, BellRing } from "lucide-react";

export const Route = createFileRoute("/alertas")({
  head: () => ({ meta: [{ title: "Alertas — StockPyme" }] }),
  component: () => (
    <DashboardLayout title="Alertas" description="Productos que requieren atención inmediata">
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Alertas activas" value="12" icon={BellRing} accent="bg-amber-50 text-amber-600" />
        <KpiCard title="Stock bajo" value="9" icon={AlertTriangle} accent="bg-amber-50 text-amber-600" />
        <KpiCard title="Sin inventario" value="3" icon={PackageX} accent="bg-rose-50 text-rose-600" />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel />
        <AlertsPanel />
      </div>
    </DashboardLayout>
  ),
});
