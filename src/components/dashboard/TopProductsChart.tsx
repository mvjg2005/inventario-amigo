import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const data = [
  { product: "Aceite 1L", ventas: 420 },
  { product: "Arroz 5Kg", ventas: 365 },
  { product: "Azúcar 5Kg", ventas: 298 },
  { product: "Café 250g", ventas: 241 },
  { product: "Detergente 2L", ventas: 198 },
];

const config = {
  ventas: { label: "Unidades vendidas", color: "hsl(221 83% 53%)" },
} satisfies ChartConfig;

export function TopProductsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos más vendidos</CardTitle>
        <CardDescription>Top 5 de las últimas 4 semanas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[280px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="product" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
