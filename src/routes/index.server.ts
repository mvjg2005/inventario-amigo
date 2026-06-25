import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";
import { DEMO_USER_ID, demoMovimientos, demoProducts } from "@/lib/demoMode";

export interface DashboardKpis {
  totalProductos: number;
  valorInventario: number;        // suma(precio * stock) en Bs
  rotacionPromedio: number;       // salidas_mes / stock_total (simplificado)
  porcentajeError: number;        // productos sin_stock / total * 100
  topProductos: { product: string; ventas: number }[];
  alertas: { product: string; sku: string; stock: number; min: number; severity: "low" | "out" }[];
  movimientosRecientes: { id: string; product: string; sku: string; type: "entrada" | "salida"; qty: number; date: string; stock: "normal" | "bajo" | "sin" }[];
}

export const getDashboardKpisFn = createServerFn({ method: "GET" }).handler(async (): Promise<DashboardKpis> => {
  const userId = await getCurrentUserId();
  if (userId === DEMO_USER_ID) {
    const totalProductos = demoProducts.length;
    const valorInventario = demoProducts.reduce((acc, p) => acc + (Number(p.precio) * Number(p.stock)), 0);
    const stockTotal = demoProducts.reduce((acc, p) => acc + Number(p.stock), 0);
    const salidaMes = demoMovimientos.filter(m => m.tipo === "salida").reduce((acc, m) => acc + m.cantidad, 0);

    return {
      totalProductos,
      valorInventario,
      rotacionPromedio: stockTotal > 0 ? Math.round((salidaMes / stockTotal) * 10) / 10 : 0,
      porcentajeError: Math.round((demoProducts.filter(p => p.estado === "sin").length / totalProductos) * 1000) / 10,
      topProductos: demoProducts.slice(0, 5).map(p => ({ product: p.nombre, ventas: Number(p.stock) })),
      alertas: demoProducts
        .filter(p => p.estado === "bajo" || p.estado === "sin")
        .map(p => ({ product: p.nombre, sku: p.sku, stock: Number(p.stock), min: 20, severity: p.estado === "sin" ? "out" as const : "low" as const })),
      movimientosRecientes: demoMovimientos.map(m => ({
        id: `MV-${m.id}`,
        product: m.producto,
        sku: m.sku,
        type: m.tipo as "entrada" | "salida",
        qty: m.cantidad,
        date: new Date(m.created_at).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" }),
        stock: "normal" as const,
      })),
    };
  }

  const client = getAuthSupabase();

  // 1. Obtener todos los productos del usuario
  const { data: productos, error: pError } = await client
    .from("productos")
    .select("id, nombre, sku, precio, stock, estado")
    .eq("user_id", userId);

  if (pError) throw new Error(pError.message);
  const prods = productos ?? [];

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
  const ventasPorProducto: Record<string, number> = {};
  movs.filter(m => m.tipo === "salida").forEach(m => {
    ventasPorProducto[m.producto] = (ventasPorProducto[m.producto] ?? 0) + m.cantidad;
  });

  // Si no hay movimientos, usar los productos con más stock como referencia
  let topProductos: { product: string; ventas: number }[];
  if (Object.keys(ventasPorProducto).length > 0) {
    topProductos = Object.entries(ventasPorProducto)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product, ventas]) => ({ product, ventas }));
  } else {
    // Sin movimientos: mostrar top 5 por valor (precio * stock)
    topProductos = prods
      .sort((a, b) => (Number(b.precio) * Number(b.stock)) - (Number(a.precio) * Number(a.stock)))
      .slice(0, 5)
      .map(p => ({ product: p.nombre.length > 12 ? p.nombre.slice(0, 12) + "…" : p.nombre, ventas: Number(p.stock) }));
  }

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
    alertas,
    movimientosRecientes,
  };
});
