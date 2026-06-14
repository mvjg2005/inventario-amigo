import { createFileRoute } from "@tanstack/react-router";
import { Package, Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MovementsTable } from "@/components/dashboard/MovementsTable";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockPyme — Panel de inventario" },
      { name: "description", content: "Sistema de gestión de inventario para pequeñas y medianas empresas." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <DashboardLayout title="Panel de control" description="Resumen general del inventario">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Productos totales" value="1.284" delta="+24 este mes" trend="up" icon={Package} accent="bg-blue-50 text-blue-600" />
        <KpiCard title="Valor del inventario" value="Bs 487.250" delta="+3,2% vs mes anterior" trend="up" icon={Wallet} accent="bg-emerald-50 text-emerald-600" />
        <KpiCard title="Rotación promedio" value="4,8x" delta="Meta 5,0x" trend="neutral" icon={RefreshCw} accent="bg-violet-50 text-violet-600" />
        <KpiCard title="Porcentaje de error" value="1,4%" delta="-0,3% vs mes anterior" trend="up" icon={AlertCircle} accent="bg-amber-50 text-amber-600" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <TopProductsChart />
          <MovementsTable />
        </div>
        <AlertsPanel />
      </section>
    </DashboardLayout>
  );
}
