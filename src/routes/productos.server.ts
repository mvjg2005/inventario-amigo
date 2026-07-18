import { createServerFn } from "@tanstack/react-start";
import { getAuthSupabase, getCurrentUserId } from "@/lib/supabase";

/**
 * Obtiene todos los productos del usuario autenticado (Supabase real).
 */
export const getProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const userId = await getCurrentUserId();
    const authClient = getAuthSupabase();

    const { data, error } = await authClient
      .from("productos")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
});

/**
 * Crea un nuevo producto para el usuario autenticado.
 */
export const createProductFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  try {
    const userId = await getCurrentUserId();
    const authClient = getAuthSupabase();

    const precio = Number(ctx.data?.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      throw new Error("El precio del producto es inválido.");
    }

    const { data, error } = await authClient
      .from("productos")
      .insert([
        {
          ...ctx.data,
          precio,
          user_id: userId,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe un producto con este SKU.");
      }
      throw new Error(error.message);
    }
    return data;
  } catch (error: any) {
    console.error("Error creating product:", error);
    throw new Error(error.message || "Error al crear el producto");
  }
});

/**
 * Actualiza un producto existente.
 */
export const updateProductFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  try {
    const userId = await getCurrentUserId();
    const authClient = getAuthSupabase();
    const { id, ...updateData } = ctx.data;

    if (updateData.precio != null) {
      const precio = Number(updateData.precio);
      if (!Number.isFinite(precio) || precio < 0) {
        throw new Error("El precio del producto es inválido.");
      }
      updateData.precio = precio;
    }

    const { data, error } = await authClient
      .from("productos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe otro producto con este SKU.");
      }
      throw new Error(error.message);
    }
    return data;
  } catch (error: any) {
    console.error("Error updating product:", error);
    throw new Error(error.message || "Error al actualizar el producto");
  }
});

/**
 * Elimina un producto específico.
 */
export const deleteProductFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  try {
    const userId = await getCurrentUserId();
    const authClient = getAuthSupabase();
    const { id } = ctx.data;

    const { error } = await authClient
      .from("productos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    throw new Error(error.message || "Error al eliminar el producto");
  }
});

/**
 * Elimina todos los productos del usuario autenticado.
 */
export const deleteAllUserProductsFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const userId = await getCurrentUserId();
    const authClient = getAuthSupabase();

    const { error } = await authClient.from("productos").delete().eq("user_id", userId);

    if (error) throw new Error(error.message);
    return { success: true, message: "Todos los productos han sido eliminados" };
  } catch (error: any) {
    console.error("Error deleting products:", error);
    throw new Error(error.message || "Error al eliminar los productos");
  }
});
