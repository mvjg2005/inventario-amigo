import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";
import { DEMO_USER_ID, demoTeamMembers } from "@/lib/demoMode";

export const getTeamMembersFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getCurrentUserId();
  if (userId === DEMO_USER_ID) return [...demoTeamMembers];

  const client = getAuthSupabase();

  const { data, error } = await client
    .from("team_members")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
});

export const inviteTeamMemberFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const userId = await getCurrentUserId();
  if (userId === DEMO_USER_ID) return { success: true };

  const client = getAuthSupabase();

  // Verificar duplicado
  const { data: existing } = await client
    .from("team_members")
    .select("id")
    .eq("owner_id", userId)
    .eq("email", ctx.data.email)
    .maybeSingle();

  if (existing) throw new Error("Ya existe un miembro con este correo electrónico.");

  const { error } = await client.from("team_members").insert([{
    owner_id: userId,
    nombre: ctx.data.nombre,
    email: ctx.data.email,
    rol: ctx.data.rol,
    estado: "pendiente",
  }]);

  if (error) throw new Error(error.message);
  return { success: true };
});

export const deleteTeamMemberFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  const userId = await getCurrentUserId();
  if (userId === DEMO_USER_ID) return { success: true };

  const client = getAuthSupabase();

  const { error } = await client
    .from("team_members")
    .delete()
    .eq("id", ctx.data.id)
    .eq("owner_id", userId);

  if (error) throw new Error(error.message);
  return { success: true };
});
