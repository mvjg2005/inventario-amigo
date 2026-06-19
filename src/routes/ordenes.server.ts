import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";

export const getOrdenesFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getCurrentUserId();
  const client = getAuthSupabase();

  const { data, error } = await client
    .from("ordenes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createOrdenFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const userId = await getCurrentUserId();
  const client = getAuthSupabase();

  // Generar número de orden secuencial en base a la cantidad actual
  const { count } = await client
    .from("ordenes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const numero = `OC-${String((count ?? 0) + 1000 + 1).padStart(4, "0")}`;

  const { error } = await client.from("ordenes").insert([
    {
      user_id: userId,
      numero,
      proveedor: ctx.data.proveedor,
      items: ctx.data.items,
      total: ctx.data.total,
      estado: ctx.data.estado,
      detalles: ctx.data.detalles || null,
    },
  ]);

  if (error) throw new Error(error.message);
  return { success: true };
});
