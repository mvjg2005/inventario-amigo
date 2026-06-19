import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";

export const getMovimientosFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getCurrentUserId();
  const client = getAuthSupabase();

  const { data, error } = await client
    .from("movimientos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createMovimientoFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const userId = await getCurrentUserId();
  const client = getAuthSupabase();

  const { error } = await client.from("movimientos").insert([
    {
      user_id: userId,
      sku: ctx.data.sku,
      producto: ctx.data.producto,
      tipo: ctx.data.tipo,
      cantidad: ctx.data.cantidad,
    },
  ]);

  if (error) throw new Error(error.message);
  return { success: true };
});
