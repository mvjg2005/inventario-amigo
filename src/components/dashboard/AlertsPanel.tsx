import { AlertTriangle, PackageX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Alert {
  product: string;
  sku: string;
  stock: number;
  min: number;
  severity: "low" | "out";
}

const alerts: Alert[] = [
  { product: "Leche en polvo 400g", sku: "LCP-040", stock: 0, min: 30, severity: "out" },
  { product: "Azúcar refinada 5Kg", sku: "AZR-050", stock: 8, min: 25, severity: "low" },
  { product: "Arroz grano fino 5Kg", sku: "ARG-050", stock: 12, min: 40, severity: "low" },
  { product: "Atún en lata 170g", sku: "ATL-017", stock: 5, min: 20, severity: "low" },
  { product: "Jabón de tocador", sku: "JBT-100", stock: 0, min: 50, severity: "out" },
];

export function AlertsPanel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas activas
          </CardTitle>
          <CardDescription>Productos con bajo inventario</CardDescription>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          {alerts.length} activas
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((a) => {
          const pct = Math.min(100, (a.stock / a.min) * 100);
          return (
            <div key={a.sku} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {a.severity === "out" && <PackageX className="h-4 w-4 text-rose-500" />}
                    {a.product}
                  </div>
                  <div className="text-xs text-muted-foreground">{a.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-foreground">{a.stock}</div>
                  <div className="text-xs text-muted-foreground">mín {a.min}</div>
                </div>
              </div>
              <Progress
                value={pct}
                className="h-1.5"
              />
            </div>
          );
        })}
        <Button variant="outline" className="w-full">
          Ver todas las alertas
        </Button>
      </CardContent>
    </Card>
  );
}
