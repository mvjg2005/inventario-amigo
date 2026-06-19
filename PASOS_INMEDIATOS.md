## 🚀 Pasos Inmediatos para Activar Sistema Multi-Usuario

### ✅ Paso 1: Ejecutar SQL en Supabase (5 minutos)

1. **Abre Supabase Console:**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto
   - Ve a **SQL Editor**

2. **Ejecuta el SQL:**
   - Abre el archivo `SUPABASE_SCHEMA.sql` de este proyecto
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **RUN**

3. **Verifica que funcionó:**
   - Deberías ver en "Execution status": **Success**
   - Ve a **Table Editor** y confirma que `productos` tiene campo `user_id`

```sql
-- Si quieres ejecutar solo lo más importante:
ALTER TABLE public.productos ADD COLUMN user_id UUID;
ALTER TABLE public.productos ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

---

### ✅ Paso 2: Limpiar Datos Antiguos (3 minutos)

**Opción A: Desde la App (⭐ Recomendado)**
```
1. Inicia sesión en StockPyme
2. Ve a la URL: http://localhost:8080/admin/limpiar-datos
3. Haz clic en "Vaciar inventario"
4. Confirma la eliminación
```

**Opción B: Desde Terminal**
```bash
npm install dotenv  # Si no está instalado
node scripts/setup-supabase.mjs --clean
```

**Opción C: Directamente en Supabase**
```sql
DELETE FROM productos WHERE 1=1;
```

---

### ✅ Paso 3: Probar Funcionamiento (5 minutos)

**En navegador:**
1. Inicia sesión: `admin@empresa.local` / `admin123`
2. Ve a **Productos**
3. Haz clic en **+ Nuevo Producto**
4. Agrega: 
   - SKU: `TEST-001`
   - Nombre: `Producto de Prueba`
   - Precio: `10`
   - Stock: `5`
5. Haz clic en **Guardar**

**Verifica en Supabase:**
1. Ve a Supabase Console
2. **Table Editor** → `productos`
3. Deberías ver tu nuevo producto
4. Abre otra sesión/navegador con otro usuario
5. Ese usuario NO deberá ver tu producto ✅

---

### ✅ Paso 4: Verificar Sincronización (2 minutos)

**Abre en 2 navegadores diferentes:**

**Navegador 1:**
- Inicia sesión como `admin@empresa.local`
- Agrega un producto: "Producto A"

**Navegador 2:**
- Abre nueva pestaña privada/incógnito
- Inicia sesión como `admin@empresa.local`
- Debería ver "Producto A" automáticamente ✅

**Navegador 3:**
- Abre nueva sesión con `empleado@empresa.local`
- NO debería ver "Producto A" (datos separados) ✅

---

## 📋 Checklist Final

- [ ] SQL ejecutado en Supabase
- [ ] Datos antiguos limpiados
- [ ] Puedo crear un producto nuevo
- [ ] El producto se guarda en Supabase
- [ ] Otro usuario no ve mis productos
- [ ] La sincronización funciona

---

## 🆘 Si algo no funciona

### Error: "Usuario no autenticado"
```
Problema: No iniciaste sesión
Solución: Ve a /login e inicia sesión primero
```

### Error: "Column user_id does not exist"
```
Problema: No ejecutaste el SQL en Supabase
Solución: Ejecuta SUPABASE_SCHEMA.sql en Supabase Console
```

### Los productos no aparecen
```
Problema: Posible problema de sincronización
Solución: 
  1. Recarga la página (F5)
  2. Abre los DevTools (F12) → Console
  3. Busca mensajes de error
```

### Los usuarios se ven los mismos productos
```
Problema: RLS no está habilitado
Solución: Ve a Supabase → Table Editor → productos → Policies
         Verifica que hay 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

---

## 📞 Documentación Completa

- 📖 **SISTEMA_MULTIUSUARIO.md** - Guía detallada del sistema
- 🗄️ **SUPABASE_SCHEMA.sql** - SQL para Supabase
- 🛠️ **scripts/setup-supabase.mjs** - Script de configuración
- 📝 **CAMBIOS.md** - Todos los cambios realizados

---

## ✨ ¡Listo!

Después de completar estos 4 pasos, tu sistema estará:
- ✅ Funcionando con datos por usuario
- ✅ Sincronizado en Supabase
- ✅ Sin datos por defecto
- ✅ Seguro (cada usuario ve solo sus datos)
- ✅ Listo para producción

**¡Bienvenido al sistema multi-usuario! 🎉**
