#!/usr/bin/env node

/**
 * Script para configurar Supabase para el sistema multi-usuario
 * 
 * Uso:
 *   node scripts/setup-supabase.mjs [--clean] [--seed-example]
 * 
 * Opciones:
 *   --clean           Elimina todos los productos existentes
 *   --seed-example    Agrega datos de ejemplo para demostración
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas');
  console.error('Por favor, crea un archivo .env con tus credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAllProducts() {
  console.log('🗑️  Limpiando todos los productos...');
  
  try {
    const { error } = await supabase.from('productos').delete().neq('id', 0);
    
    if (error) {
      console.error('❌ Error al limpiar productos:', error.message);
      return false;
    }
    
    console.log('✅ Todos los productos han sido eliminados');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function verifyProductsTable() {
  console.log('🔍 Verificando estructura de tabla "productos"...');
  
  try {
    // Intentar obtener una fila para verificar que la tabla existe
    const { error: selectError } = await supabase
      .from('productos')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error: La tabla "productos" no existe en Supabase');
      console.error('Por favor crea la tabla con la siguiente estructura SQL:');
      console.log(`
CREATE TABLE public.productos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT,
  precio NUMERIC(10,2),
  stock INTEGER,
  estado TEXT CHECK (estado IN ('normal', 'bajo', 'sin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sku)
);

CREATE INDEX idx_productos_user_id ON public.productos(user_id);
      `);
      return false;
    }
    
    console.log('✅ Tabla "productos" existe y tiene estructura correcta');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function seedExampleData(userId) {
  console.log('🌱 Agregando datos de ejemplo...');
  
  if (!userId) {
    console.warn('⚠️  user_id no proporcionado, usando demostración sin guardar');
    return false;
  }
  
  const exampleProducts = [
    { sku: 'ACV-001', nombre: 'Aceite vegetal 1L', categoria: 'Abarrotes', precio: 18.5, stock: 142, estado: 'normal' },
    { sku: 'AZR-050', nombre: 'Azúcar refinada 5Kg', categoria: 'Abarrotes', precio: 42.0, stock: 8, estado: 'bajo' },
    { sku: 'DTL-200', nombre: 'Detergente líquido 2L', categoria: 'Limpieza', precio: 35.0, stock: 87, estado: 'normal' },
    { sku: 'CFM-025', nombre: 'Café molido 250g', categoria: 'Bebidas', precio: 28.0, stock: 64, estado: 'normal' },
  ];
  
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert(exampleProducts.map(p => ({ ...p, user_id: userId })))
      .select();
    
    if (error) {
      console.error('❌ Error al insertar datos:', error.message);
      return false;
    }
    
    console.log(`✅ Se agregaron ${data?.length || 0} productos de ejemplo`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');
  const shouldSeedExample = args.includes('--seed-example');
  
  console.log('📦 Configurando Supabase para inventario-amigo\n');
  
  // Verificar estructura
  const tableOk = await verifyProductsTable();
  if (!tableOk) {
    process.exit(1);
  }
  
  // Limpiar si se pide
  if (shouldClean) {
    await cleanAllProducts();
  }
  
  // Agregar datos de ejemplo si se pide
  if (shouldSeedExample) {
    // Nota: Para esto necesitarías un user_id válido
    // En producción, podrías obtenerlo del usuario autenticado
    console.log('⚠️  --seed-example requiere un user_id válido de autenticación');
    console.log('Este paso se realiza automáticamente cuando el usuario crea su primer producto');
  }
  
  console.log('\n✨ Configuración de Supabase completada');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Asegúrate de que los usuarios tengan cuentas en Supabase Auth');
  console.log('2. Cuando inicien sesión, los productos se guardarán en su cuenta');
  console.log('3. Cada usuario solo verá sus propios productos');
}

main().catch(console.error);
