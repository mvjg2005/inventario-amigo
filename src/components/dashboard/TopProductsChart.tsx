import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface TopProductsChartProps {
  data: { product: string; ventas: number }[];
}

const config = {
  ventas: { label: "Unidades", color: "hsl(221 83% 53%)" },
} satisfies ChartConfig;

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos más vendidos</CardTitle>
        <CardDescription>
          {data.length > 0 ? "Top productos por salidas registradas" : "Sin movimientos registrados aún"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            Registra movimientos de salida para ver el gráfico
          </div>
        ) : (
          <ChartContainer config={config} className="h-[280px] w-full">
            <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="product" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
