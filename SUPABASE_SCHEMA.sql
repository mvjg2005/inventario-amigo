-- =========================================
-- Schema SQL para Supabase - Tabla productos
-- =========================================
-- 
-- Ejecuta este SQL en Supabase SQL Editor para:
-- 1. Crear/actualizar tabla productos con user_id
-- 2. Establecer políticas de seguridad
-- 3. Garantizar datos por usuario
--
-- =========================================

-- 1️⃣ Crear tabla productos (si no existe)
CREATE TABLE IF NOT EXISTS public.productos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT '',
  precio NUMERIC(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'normal' CHECK (estado IN ('normal', 'bajo', 'sin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sku)
);

-- 2️⃣ Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_user_id ON public.productos(user_id);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON public.productos(created_at);

-- 3️⃣ Activar RLS (Row Level Security)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- 4️⃣ Eliminar políticas antiguas (si existen)
DROP POLICY IF EXISTS "usuarios_solo_ven_propios" ON public.productos;
DROP POLICY IF EXISTS "usuarios_pueden_insertar_propios" ON public.productos;
DROP POLICY IF EXISTS "usuarios_pueden_actualizar_propios" ON public.productos;
DROP POLICY IF EXISTS "usuarios_pueden_eliminar_propios" ON public.productos;

-- 5️⃣ Crear políticas RLS para seguridad

-- SELECT: Los usuarios solo ven sus propios productos
CREATE POLICY "usuarios_solo_ven_propios"
  ON public.productos FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Los usuarios solo pueden insertar en sus propios productos
CREATE POLICY "usuarios_pueden_insertar_propios"
  ON public.productos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Los usuarios solo pueden actualizar sus propios productos
CREATE POLICY "usuarios_pueden_actualizar_propios"
  ON public.productos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Los usuarios solo pueden eliminar sus propios productos
CREATE POLICY "usuarios_pueden_eliminar_propios"
  ON public.productos FOR DELETE
  USING (auth.uid() = user_id);

-- 6️⃣ Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_productos_updated_at ON public.productos;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7️⃣ (Opcional) Limpiar datos existentes sin user_id
-- Descomenta si tienes datos antiguos sin user_id y quieres eliminarlos
-- DELETE FROM productos WHERE user_id IS NULL;

-- ✅ Verificación final
SELECT 
  count(*) as total_productos,
  count(DISTINCT user_id) as usuarios_con_productos
FROM public.productos;
