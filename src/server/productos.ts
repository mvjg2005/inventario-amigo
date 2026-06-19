import { createServerFn } from "@tanstack/react-start";
import { supabase, getCurrentUserId } from "../lib/supabase";

/**
 * Obtiene todos los productos del usuario autenticado
 * Solo retorna productos pertenecientes al usuario actual
 */
export const getProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });
      
    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
});

/**
 * Crea un nuevo producto para el usuario autenticado
 * Automáticamente asigna el user_id del usuario actual
 */
// @ts-ignore
export const createProductFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          ...ctx.data,
          user_id: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select();
      
    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
});

/**
 * Elimina todos los productos del usuario autenticado
 * (Útil para limpiar datos de prueba)
 */
export const deleteAllUserProductsFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const userId = await getCurrentUserId();
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('user_id', userId);
      
    if (error) throw new Error(error.message);
    return { success: true, message: "Todos los productos han sido eliminados" };
  } catch (error) {
    console.error("Error deleting products:", error);
    throw error;
  }
});