# 🔄 Guía: Sistema Multi-Usuario con Supabase

## ✨ Lo que cambió

Tu sistema StockPyme ahora está configurado para **un inventario por usuario**:

- ✅ **Datos por usuario**: Cada usuario solo ve sus propios productos
- ✅ **Sin datos por defecto**: El sistema inicia vacío para cada usuario
- ✅ **Guardado automático**: Los datos se guardan en Supabase
- ✅ **Sincronización**: Los cambios se sincronizar entre dispositivos automáticamente

## 🗑️ Cómo vaciar el sistema de datos por defecto

### Opción 1: A través de la interfaz (⭐ Recomendado)

1. Inicia sesión en StockPyme
2. Ve a: `/admin/limpiar-datos`
3. Haz clic en "Vaciar inventario"
4. Confirma la acción

**Ventaja**: No necesitas acceso a terminal, es seguro y reversible en Supabase.

### Opción 2: A través de terminal

```bash
# Limpiar todos los productos en Supabase
node scripts/setup-supabase.mjs --clean
```

### Opción 3: Eliminar datos directamente en Supabase

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a "SQL Editor" o "Table Editor"
4. Ejecuta:
```sql
DELETE FROM productos WHERE 1=1;
```

## 📋 Estructura de la tabla `productos`

Tu tabla en Supabase ahora tiene esta estructura:

```sql
CREATE TABLE public.productos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,              -- ← Vinculado a auth.users(id)
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT,
  precio NUMERIC(10,2),
  stock INTEGER,
  estado TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, sku)                -- ← Garantiza SKU único por usuario
);
```

### Cambios importantes:
- **`user_id`**: Cada producto está vinculado al usuario que lo creó
- **`UNIQUE(user_id, sku)`**: Dos usuarios pueden tener productos con el mismo SKU
- **`created_at`**: Se asigna automáticamente
- **Sin datos por defecto**: La tabla empieza vacía

## 🔒 Cómo funciona la seguridad

### Filtrado automático:
```typescript
// Solo se muestran productos del usuario logueado
const { data } = await supabase
  .from('productos')
  .select('*')
  .eq('user_id', currentUserId)  // ← Filtro por usuario
  .order('id', { ascending: false });
```

### Al crear producto:
```typescript
// El user_id se asigna automáticamente
await supabase
  .from('productos')
  .insert([
    {
      ...datosProducto,
      user_id: currentUserId,  // ← Se asigna automáticamente
      created_at: new Date()
    }
  ]);
```

## 📊 Funciones nuevas disponibles

### 1. Vaciar todos los productos del usuario
```typescript
import { deleteAllUserProductsFn } from '@/routes/productos.server';

await deleteAllUserProductsFn();
```

### 2. Obtener usuario actual
```typescript
import { getCurrentUserId, getCurrentUser } from '@/lib/supabase';

const userId = await getCurrentUserId();
const user = await getCurrentUser();
```

## 🚀 Próximos pasos

1. ✅ **Vaciar datos** - Usa `/admin/limpiar-datos` o el script
2. ✅ **Verificar Supabase** - Confirma que la tabla tenga `user_id`
3. ✅ **Crear datos nuevos** - Agrega productos manualmente a través de la app
4. ✅ **Comprobar sincronización** - Abre en otro dispositivo/navegador

## 🐛 Solución de problemas

### "Usuario no autenticado" error
- **Problema**: No estás logueado
- **Solución**: Inicia sesión en `/login`

### Los productos no se guardan
- **Problema**: Supabase URL o clave no configurada
- **Solución**: Verifica las variables de ambiente en `.env`:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=xxxx
  ```

### Ver datos en Supabase sin app
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a "Table Editor"
4. Abre tabla `productos`
5. Filtra por `user_id` con tu ID de usuario

## 💡 Tips

- Cada usuario tiene su inventario **completamente separado**
- No hay acceso cruzado entre usuarios (seguro)
- Los datos persisten en Supabase indefinidamente
- Puedes usar `/admin/limpiar-datos` tantas veces como necesites

## 📞 Necesitas ayuda?

- Ver logs del servidor: Revisa la consola del navegador (F12)
- Probar queries de Supabase: Usa "SQL Editor" en Supabase Dashboard
- Verificar autenticación: Usa Developer Tools → Storage → Cookies (busca `auth_session`)
