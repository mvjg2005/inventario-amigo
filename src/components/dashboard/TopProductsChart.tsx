import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface TopProductBar {
  product: string;
  fullName?: string;
  ventas: number;
  categoria?: string;
}

interface TopProductsChartProps {
  data: TopProductBar[];
}

/** Paleta profesional por categoría (coherente y legible en dashboard). */
const CATEGORY_COLORS: Record<string, string> = {
  abarrotes: "#2563EB", // blue-600
  lacteos: "#0D9488", // teal-600
  lácteos: "#0D9488",
  bebidas: "#7C3AED", // violet-600
  limpieza: "#0891B2", // cyan-600
  snacks: "#EA580C", // orange-600
  panaderia: "#D97706", // amber-600
  panadería: "#D97706",
  carnes: "#E11D48", // rose-600
  frutas: "#16A34A", // green-600
  verduras: "#65A30D", // lime-600
  congelados: "#0284C7", // sky-600
  higiene: "#DB2777", // pink-600
  farmacia: "#4F46E5", // indigo-600
  tecnologia: "#475569", // slate-600
  tecnología: "#475569",
  general: "#64748B", // slate-500
  otros: "#78716C", // stone-500
};

/** Colores de respaldo para categorías nuevas / personalizadas */
const FALLBACK_PALETTE = [
  "#2563EB",
  "#0D9488",
  "#7C3AED",
  "#EA580C",
  "#DB2777",
  "#16A34A",
  "#0284C7",
  "#D97706",
  "#E11D48",
  "#4F46E5",
  "#0891B2",
  "#65A30D",
];

function normalizeCategory(raw?: string | null): string {
  const value = (raw ?? "General").trim();
  return value || "General";
}

function categoryKey(categoria: string): string {
  return normalizeCategory(categoria)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getCategoryColor(categoria?: string | null): string {
  const key = categoryKey(categoria ?? "General");
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  return FALLBACK_PALETTE[hashString(key) % FALLBACK_PALETTE.length];
}

const chartConfig = {
  ventas: { label: "Unidades", color: "hsl(221 83% 53%)" },
} satisfies ChartConfig;

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: TopProductBar & { fill?: string };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const color = row.fill || getCategoryColor(row.categoria);
  const name = row.fullName || row.product;
  const categoria = normalizeCategory(row.categoria);

  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5 shadow-lg shadow-black/5">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
          style={{ backgroundColor: color }}
        />
        <p className="max-w-[220px] truncate text-sm font-semibold text-foreground">
          {name}
        </p>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Categoría</span>
          <span className="font-medium text-foreground">{categoria}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Unidades</span>
          <span className="font-semibold tabular-nums text-foreground">
            {Number(payload[0]?.value ?? row.ventas).toLocaleString("es-BO")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = data.map((item) => {
    const categoria = normalizeCategory(item.categoria);
    return {
      ...item,
      categoria,
      fullName: item.fullName || item.product,
      fill: getCategoryColor(categoria),
    };
  });

  // Leyenda: categorías únicas en el orden en que aparecen
  const legendItems: { categoria: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const item of chartData) {
    const key = categoryKey(item.categoria);
    if (seen.has(key)) continue;
    seen.add(key);
    legendItems.push({ categoria: item.categoria, color: item.fill });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>
              {data.length > 0
                ? "Top productos por salidas · color según categoría"
                : "Sin movimientos registrados aún"}
            </CardDescription>
          </div>
          {legendItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:max-w-[55%] sm:justify-end">
              {legendItems.map((item) => (
                <span
                  key={item.categoria}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border/60",
                    "bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground/90",
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  {item.categoria}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Registra movimientos de salida para ver el gráfico
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[240px] w-full sm:h-[300px]">
            <BarChart
              data={chartData}
              margin={{ left: 0, right: 8, top: 12, bottom: 4 }}
              barCategoryGap="18%"
            >
              <defs>
                {chartData.map((item, index) => (
                  <linearGradient
                    key={`grad-${index}-${item.product}`}
                    id={`barGrad-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={item.fill} stopOpacity={1} />
                    <stop offset="100%" stopColor={item.fill} stopOpacity={0.72} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                dataKey="product"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={36}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
                content={<CategoryTooltip />}
              />
              <Bar dataKey="ventas" radius={[8, 8, 4, 4]} maxBarSize={56}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.product}-${index}`}
                    fill={`url(#barGrad-${index})`}
                    stroke={entry.fill}
                    strokeOpacity={0.15}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
