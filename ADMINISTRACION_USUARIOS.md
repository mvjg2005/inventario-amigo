# Guía: Administración de Usuarios (Para Una Sola Empresa)

## 📋 Vista General

El sistema tiene usuarios creados por defecto que se generan automáticamente en la primera ejecución.

---

## 🔑 Credenciales por Defecto

| Rol | Email | Contraseña | Descripción |
|-----|-------|-----------|-------------|
| **Admin** | `admin@empresa.local` | `admin123` | Acceso completo al sistema |
| **Empleado** | `empleado@empresa.local` | `empleado123` | Acceso limitado (solo lectura) |

---

## 🔄 Cambiar Contraseña

### Opción 1: Usar herramienta SQLite GUI
1. Abre `sqlite.db` con **DBeaver** o **SQLite Browser**
2. Navega a la tabla `usuarios`
3. Haz doble clic en el campo `password`
4. Cambia el valor por la nueva contraseña
5. Guarda los cambios

### Opción 2: Usar SQL directo
```sql
UPDATE usuarios 
SET password = 'nueva_contraseña' 
WHERE email = 'admin@empresa.local';
```

⚠️ Las contraseñas se guardan en **texto plano** (solo para demo local)

---

## ➕ Agregar Nuevos Usuarios

### Opción 1: Base de Datos GUI
1. Abre `sqlite.db` con **DBeaver** o **SQLite Browser**
2. Navega a la tabla `usuarios`
3. Haz clic en "New Row"
4. Completa los datos:
   - nombre: Nombre del usuario
   - email: Email único (ej: gerente@empresa.local)
   - password: Contraseña en texto plano
   - rol: 'admin' o 'empleado'
5. Guarda los cambios

### Opción 2: SQL directo
```sql
INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Juan García', 'juan@empresa.local', 'juan123', 'empleado');
```

### Opción 3: Editar en código (antes de primera ejecución)

Edita `src/db/index.ts` alrededor de la línea 48:

```typescript
if (usuariosCount.count === 0) {
  const insertUsuario = sqlite.prepare(
    "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)"
  );
  
  // Usuario admin por defecto
  insertUsuario.run("Administrador", "admin@empresa.local", "admin123", "admin");
  
  // Usuario empleado por defecto
  insertUsuario.run("Empleado", "empleado@empresa.local", "empleado123", "empleado");
  
  // AGREGAR MÁS USUARIOS AQUÍ:
  insertUsuario.run("Gerente", "gerente@empresa.local", "gerente123", "admin");
  insertUsuario.run("Vendedor", "vendedor@empresa.local", "vendedor123", "empleado");
}
```

Luego:
1. Elimina el archivo `sqlite.db`
2. Reinicia la aplicación
3. Se recreará con los nuevos usuarios

---

## 🛠️ Modificar Datos de Empresa

Los datos de la empresa se guardan en la tabla `empresa`. Para modificarlos:

### Opción 1: Base de Datos GUI
1. Abre `sqlite.db`
2. Navega a la tabla `empresa`
3. Edita los campos:
   - nombre: Nombre de tu empresa
   - ruc: RUC/NIT
   - direccion: Dirección
   - telefono: Teléfono
   - email: Email

### Opción 2: SQL directo
```sql
UPDATE empresa
SET 
  nombre = 'Mi Tienda S.A.',
  ruc = '123456789012',
  direccion = 'Calle Principal 456',
  telefono = '+591 2 9876543',
  email = 'contacto@mitienda.com'
WHERE id = 1;
```

### Opción 3: Editar en código (antes de primera ejecución)

Edita `src/db/index.ts` alrededor de la línea 43:

```typescript
if (empresaCount.count === 0) {
  const insertEmpresa = sqlite.prepare(
    "INSERT INTO empresa (nombre, ruc, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)"
  );
  
  insertEmpresa.run(
    "Mi Tienda S.A.",           // ← Nombre de empresa
    "123456789012",              // ← RUC/NIT
    "Calle Principal 456",       // ← Dirección
    "+591 2 9876543",            // ← Teléfono
    "contacto@mitienda.com"      // ← Email
  );
}
```

---

## 🗑️ Eliminar Usuarios

### Opción 1: Base de Datos GUI
1. Abre `sqlite.db` con **DBeaver** o **SQLite Browser**
2. Navega a la tabla `usuarios`
3. Haz clic derecho en el usuario → Delete
4. Confirma la eliminación

### Opción 2: SQL directo
```sql
DELETE FROM usuarios 
WHERE email = 'empleado@empresa.local';
```

⚠️ Ten cuidado de no eliminar todos los usuarios

---

## 📊 Ver Todos los Usuarios

### Con SQL
```sql
SELECT id, nombre, email, rol FROM usuarios;
```

### Con GUI
1. Abre `sqlite.db` con **DBeaver** o **SQLite Browser**
2. Navega a la tabla `usuarios`
3. Verás todos los usuarios listados

---

## 🔐 Notas de Seguridad

### Este Sistema Es Local
- ✅ Seguro para usar offline
- ✅ Datos guardados localmente en SQLite
- ✅ Sin transmisión de datos por internet

### No Usar en Línea Sin
- ❌ Hashear contraseñas (usar bcrypt/argon2)
- ❌ Implementar HTTPS
- ❌ Agregar validaciones adicionales
- ❌ Implementar logs de auditoría

---

## 🆘 Problemas Comunes

### "Error: usuario no encontrado"
- Verifica el email exactamente (mayúsculas/minúsculas)
- Revisa que el usuario exista en la tabla `usuarios`

### "Todos olvidaron su contraseña"
- Abre `sqlite.db` con SQLite Browser
- Cambia la contraseña del admin
- O elimina `sqlite.db` y reinicia para resetear

### Base de datos corrupta
- Elimina el archivo `sqlite.db`
- Reinicia la aplicación
- Se recreará con datos iniciales
