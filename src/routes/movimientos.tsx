import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MovementsTable } from "@/components/dashboard/MovementsTable";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";

export const Route = createFileRoute("/movimientos")({
  head: () => ({ meta: [{ title: "Movimientos — StockPyme" }] }),
  component: () => (
    <DashboardLayout title="Movimientos" description="Historial de entradas y salidas del almacén">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Últimos 30 días</p>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Registrar movimiento</Button>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Entradas" value="842" delta="+12% vs mes anterior" trend="up" icon={ArrowDownLeft} accent="bg-emerald-50 text-emerald-600" />
        <KpiCard title="Salidas" value="1.156" delta="+8% vs mes anterior" trend="up" icon={ArrowUpRight} accent="bg-rose-50 text-rose-600" />
        <KpiCard title="Ajustes" value="34" delta="-2 vs mes anterior" trend="neutral" icon={Repeat} accent="bg-blue-50 text-blue-600" />
      </section>
      <MovementsTable />
    </DashboardLayout>
  ),
});
