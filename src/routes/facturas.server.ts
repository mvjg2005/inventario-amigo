import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";
import { DEMO_USER_ID, demoFacturas } from "@/lib/demoMode";

export const getFacturasFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getCurrentUserId();
  if (userId === DEMO_USER_ID) return [...demoFacturas];

  const client = getAuthSupabase();

  const { data, error } = await client
    .from("facturas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createFacturaFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const userId = await getCurrentUserId();
  if (userId === DEMO_USER_ID) return { success: true };

  const client = getAuthSupabase();

  // Generar número de factura secuencial
  const { count } = await client
    .from("facturas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const numero = `F-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { error } = await client.from("facturas").insert([
    {
      user_id: userId,
      numero,
      cliente: ctx.data.cliente,
      total_bs: ctx.data.total_bs,
      estado: ctx.data.estado,
      detalles: ctx.data.detalles || null,
      fecha: new Date().toISOString().split("T")[0],
    },
  ]);

  if (error) throw new Error(error.message);
  return { success: true };
});
