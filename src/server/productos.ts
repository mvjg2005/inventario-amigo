import { createServerFn } from "@tanstack/react-start";
import { supabase } from "../lib/supabase";

export const getProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
});

// @ts-ignore
export const createProductFn = createServerFn({ method: "POST" }).handler(async (ctx: any) => {
    const { data, error } = await supabase.from('productos').insert([ctx.data]).select();
    if (error) throw new Error(error.message);
    return data;
  });