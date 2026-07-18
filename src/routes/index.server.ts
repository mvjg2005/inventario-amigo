import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";

export interface TopProductoKpi {
  product: string;
  fullName: string;
  ventas: number;
  categoria: string;
}

export interface CategoriaDistribucion {
  name: string;
  /** Cantidad de productos en la categoría */
  productos: number;
  /** Unidades en stock */
  stock: number;
  /** Valor monetario (precio × stock) */
  valor: number;
}

export interface DashboardKpis {
  totalProductos: number;
  valorInventario: number;        // suma(precio * stock) en Bs
  rotacionPromedio: number;       // salidas_mes / stock_total (simplificado)
  porcentajeError: number;        // productos sin_stock / total * 100
  topProductos: TopProductoKpi[];
  /** Distribución por categoría para gráfico de torta (Power BI) */
  categorias: CategoriaDistribucion[];
  alertas: { product: string; sku: string; stock: number; min: number; severity: "low" | "out" }[];
  movimientosRecientes: { id: string; product: string; sku: string; type: "entrada" | "salida"; qty: number; date: string; stock: "normal" | "bajo" | "sin" }[];
}

function shortLabel(nombre: string, max = 14) {
  const clean = String(nombre ?? "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function resolveCategoria(
  productName: string,
  byName: Map<string, string>,
  bySku: Map<string, string>,
  sku?: string | null,
): string {
  if (sku && bySku.has(sku)) return bySku.get(sku)!;
  const direct = byName.get(productName);
  if (direct) return direct;
  // Coincidencia flexible (mayúsculas / espacios)
  const key = productName.trim().toLowerCase();
  for (const [nombre, cat] of byName) {
    if (nombre.trim().toLowerCase() === key) return cat;
  }
  return "General";
}

export const getDashboardKpisFn = createServerFn({ method: "GET" }).handler(async (): Promise<DashboardKpis> => {
  const userId = await getCurrentUserId();
  const client = getAuthSupabase();

  // 1. Obtener todos los productos del usuario
  const { data: productos, error: pError } = await client
    .from("productos")
    .select("id, nombre, sku, precio, stock, estado, categoria")
    .eq("user_id", userId);

  if (pError) throw new Error(pError.message);
  const prods = productos ?? [];

  const categoriaByNombre = new Map<string, string>();
  const categoriaBySku = new Map<string, string>();
  for (const p of prods) {
    const cat = (p.categoria && String(p.categoria).trim()) || "General";
    if (p.nombre) categoriaByNombre.set(String(p.nombre), cat);
    if (p.sku) categoriaBySku.set(String(p.sku), cat);
  }

  // 2. Obtener movimientos del mes actual
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data: movsMes } = await client
    .from("movimientos")
    .select("producto, sku, tipo, cantidad, created_at")
    .eq("user_id", userId)
    .gte("created_at", inicioMes.toISOString())
    .order("created_at", { ascending: false });

  const movs = movsMes ?? [];

  // 3. Obtener últimos 10 movimientos para tabla del dashboard
  const { data: movsRecientes } = await client
    .from("movimientos")
    .select("id, producto, sku, tipo, cantidad, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // ─── Calcular KPIs ─────────────────────────────────────────────────────────

  const totalProductos = prods.length;

  // Valor del inventario = suma(precio * stock)
  const valorInventario = prods.reduce((acc, p) => acc + (Number(p.precio) * Number(p.stock)), 0);

  // Rotación = unidades salidas este mes / stock total actual
  const salidaMes = movs.filter(m => m.tipo === "salida").reduce((acc, m) => acc + m.cantidad, 0);
  const stockTotal = prods.reduce((acc, p) => acc + Number(p.stock), 0);
  const rotacionPromedio = stockTotal > 0 ? Math.round((salidaMes / stockTotal) * 10) / 10 : 0;

  // Porcentaje de error = productos con estado 'sin' (sin stock) / total
  const sinStock = prods.filter(p => p.estado === "sin").length;
  const porcentajeError = totalProductos > 0
    ? Math.round((sinStock / totalProductos) * 100 * 10) / 10
    : 0;

  // Top 5 productos más vendidos (por salidas en movimientos del mes)
  const ventasPorProducto: Record<string, { qty: number; sku?: string }> = {};
  movs.filter(m => m.tipo === "salida").forEach(m => {
    const key = m.producto;
    const prev = ventasPorProducto[key];
    ventasPorProducto[key] = {
      qty: (prev?.qty ?? 0) + Number(m.cantidad),
      sku: m.sku ?? prev?.sku,
    };
  });

  // Si no hay movimientos, usar los productos con más stock como referencia
  let topProductos: TopProductoKpi[];
  if (Object.keys(ventasPorProducto).length > 0) {
    topProductos = Object.entries(ventasPorProducto)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)
      .map(([product, info]) => {
        const categoria = resolveCategoria(
          product,
          categoriaByNombre,
          categoriaBySku,
          info.sku,
        );
        return {
          product: shortLabel(product),
          fullName: product,
          ventas: info.qty,
          categoria,
        };
      });
  } else {
    // Sin movimientos: mostrar top 5 por valor (precio * stock)
    topProductos = [...prods]
      .sort((a, b) => (Number(b.precio) * Number(b.stock)) - (Number(a.precio) * Number(a.stock)))
      .slice(0, 5)
      .map((p) => {
        const fullName = String(p.nombre ?? "");
        const categoria =
          (p.categoria && String(p.categoria).trim()) || "General";
        return {
          product: shortLabel(fullName),
          fullName,
          ventas: Number(p.stock),
          categoria,
        };
      });
  }

  // Distribución por categoría (gráfico de torta estilo Power BI)
  const byCat = new Map<string, CategoriaDistribucion>();
  for (const p of prods) {
    const name = (p.categoria && String(p.categoria).trim()) || "General";
    const prev = byCat.get(name) ?? { name, productos: 0, stock: 0, valor: 0 };
    prev.productos += 1;
    prev.stock += Number(p.stock) || 0;
    prev.valor += (Number(p.precio) || 0) * (Number(p.stock) || 0);
    byCat.set(name, prev);
  }
  const categorias = [...byCat.values()].sort((a, b) => b.valor - a.valor);

  // Alertas: productos con stock bajo (bajo o sin)
  const alertas = prods
    .filter(p => p.estado === "bajo" || p.estado === "sin")
    .slice(0, 6)
    .map(p => ({
      product: p.nombre,
      sku: p.sku,
      stock: Number(p.stock),
      min: 20, // umbral genérico; podría ser un campo en BD en el futuro
      severity: p.estado === "sin" ? "out" as const : "low" as const,
    }));

  // Movimientos recientes para la tabla del dashboard
  const movimientosRecientes = (movsRecientes ?? []).map(m => ({
    id: `MV-${m.id}`,
    product: m.producto,
    sku: m.sku,
    type: m.tipo as "entrada" | "salida",
    qty: m.cantidad,
    date: new Date(m.created_at).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" }),
    stock: "normal" as const,
  }));

  return {
    totalProductos,
    valorInventario,
    rotacionPromedio,
    porcentajeError,
    topProductos,
    categorias,
    alertas,
    movimientosRecientes,
  };
});
