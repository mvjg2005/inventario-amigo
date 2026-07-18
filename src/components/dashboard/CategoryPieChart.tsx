import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, Sector } from "recharts";
import { Palette, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn, formatMoney } from "@/lib/utils";
import { getCategoryColor } from "@/components/dashboard/TopProductsChart";
import type { CategoriaDistribucion } from "@/routes/index.server";

const STORAGE_KEY = "stockpyme_pie_colors";

export type PieMetric = "valor" | "stock" | "productos";

const METRIC_LABELS: Record<PieMetric, string> = {
  valor: "Valor (Bs)",
  stock: "Unidades en stock",
  productos: "Nº de productos",
};

interface CategoryPieChartProps {
  data: CategoriaDistribucion[];
}

const chartConfig = {
  valor: { label: "Valor", color: "hsl(221 83% 53%)" },
} satisfies ChartConfig;

function loadSavedColors(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveColors(colors: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

function PieTooltip({
  active,
  payload,
  metric,
  total,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: CategoriaDistribucion & { fill?: string; pct?: number };
  }>;
  metric: PieMetric;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const value = Number(payload[0]?.value ?? 0);
  const pct = total > 0 ? (value / total) * 100 : 0;
  const display =
    metric === "valor"
      ? formatMoney(value)
      : value.toLocaleString("es-BO");

  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5 shadow-lg shadow-black/5">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
          style={{ backgroundColor: row.fill }}
        />
        <p className="text-sm font-semibold text-foreground">{row.name}</p>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">{METRIC_LABELS[metric]}</span>
          <span className="font-semibold tabular-nums text-foreground">{display}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Participación</span>
          <span className="font-semibold tabular-nums text-foreground">
            {pct.toFixed(1).replace(".", ",")} %
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Productos</span>
          <span className="font-medium tabular-nums text-foreground">
            {row.productos.toLocaleString("es-BO")}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Sector activo con ligero “pop” al hover (estilo Power BI). */
function ActiveShape(props: any) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.35}
      />
    </g>
  );
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [metric, setMetric] = useState<PieMetric>("valor");
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [colorPanelOpen, setColorPanelOpen] = useState(false);

  useEffect(() => {
    setCustomColors(loadSavedColors());
  }, []);

  const resolveColor = useCallback(
    (name: string) => customColors[name] || getCategoryColor(name),
    [customColors],
  );

  const chartData = useMemo(() => {
    return data
      .map((item) => ({
        ...item,
        value: item[metric],
        fill: resolveColor(item.name),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, metric, resolveColor]);

  const total = useMemo(
    () => chartData.reduce((acc, d) => acc + d.value, 0),
    [chartData],
  );

  const setColor = (name: string, color: string) => {
    setCustomColors((prev) => {
      const next = { ...prev, [name]: color };
      saveColors(next);
      return next;
    });
  };

  const resetColors = () => {
    setCustomColors({});
    saveColors({});
  };

  const hasCustom = Object.keys(customColors).length > 0;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              Inventario por categoría
            </CardTitle>
            <CardDescription>
              {data.length > 0
                ? "Gráfico de torta · personaliza cada color a tu gusto"
                : "Sin productos para graficar"}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de métrica */}
            <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5">
              {(Object.keys(METRIC_LABELS) as PieMetric[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    metric === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {key === "valor" ? "Valor" : key === "stock" ? "Stock" : "Items"}
                </button>
              ))}
            </div>

            {/* Panel de colores */}
            <Popover open={colorPanelOpen} onOpenChange={setColorPanelOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                >
                  <Palette className="h-3.5 w-3.5" />
                  Colores
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                collisionPadding={16}
                className="w-[min(18rem,calc(100vw-2rem))] max-h-[min(24rem,70dvh)] overflow-y-auto p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">Colores del gráfico</p>
                  {hasCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
                      onClick={resetColors}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restablecer
                    </Button>
                  )}
                </div>
                <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                  Elige cualquier color para cada categoría. Se guarda en este navegador.
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {data.map((item) => {
                    const color = resolveColor(item.name);
                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/20 px-2 py-1.5"
                      >
                        <Label
                          htmlFor={`pie-color-${item.name}`}
                          className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate">{item.name}</span>
                        </Label>
                        <input
                          id={`pie-color-${item.name}`}
                          type="color"
                          value={color}
                          onChange={(e) => setColor(item.name, e.target.value)}
                          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                          title={`Color de ${item.name}`}
                        />
                      </div>
                    );
                  })}
                  {data.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No hay categorías aún
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Agrega productos con categoría para ver el gráfico de torta
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
            <div className="relative mx-auto w-full min-w-0 max-w-[280px] sm:max-w-[340px]">
              <ChartContainer
                config={chartConfig}
                className="aspect-square h-[240px] w-full sm:h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <PieTooltip metric={metric} total={total} />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="82%"
                    paddingAngle={1.5}
                    stroke="#fff"
                    strokeWidth={2}
                    activeIndex={activeIndex}
                    activeShape={ActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill}
                        className="cursor-pointer outline-none transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Centro tipo Power BI: total */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </span>
                <span className="max-w-[46%] truncate text-center text-sm font-semibold tabular-nums text-foreground">
                  {metric === "valor"
                    ? formatMoney(total)
                    : total.toLocaleString("es-BO")}
                </span>
              </div>
            </div>

            {/* Leyenda interactiva con % y color picker inline */}
            <div className="flex min-w-0 flex-col justify-center gap-1.5">
              {chartData.map((item, index) => {
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                const isActive = activeIndex === index;
                return (
                  <div
                    key={item.name}
                    className={cn(
                      "group flex min-w-0 items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors",
                      isActive && "border-border/70 bg-muted/50",
                      "hover:bg-muted/40",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    <label className="relative flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center">
                      <span
                        className="absolute inset-0 rounded-sm shadow-sm ring-1 ring-black/10"
                        style={{ backgroundColor: item.fill }}
                      />
                      <input
                        type="color"
                        value={item.fill}
                        onChange={(e) => setColor(item.name, e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        title={`Cambiar color de ${item.name}`}
                        aria-label={`Color de ${item.name}`}
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="break-words text-[10px] tabular-nums text-muted-foreground">
                        {pct.toFixed(1).replace(".", ",")} %
                        {metric === "valor"
                          ? ` · ${formatMoney(item.value)}`
                          : ` · ${item.value.toLocaleString("es-BO")}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ayuda a ancho completo para que no se corte en la columna estrecha */}
            <p className="col-span-full rounded-md bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Clic en el <span className="font-medium text-foreground">cuadrado de color</span> de
              cada categoría, o en el botón <span className="font-medium text-foreground">Colores</span>,
              para elegir cualquier tono. Los cambios se guardan en este navegador.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
