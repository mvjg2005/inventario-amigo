# StockPyme - Sistema Offline para Una Sola Empresa

## 🎯 Cambios Realizados

El código ha sido adaptado para funcionar **sin internet** y como un sistema **de una sola empresa**.

### ✅ Características Implementadas

1. **Base de Datos Local (SQLite)**
   - Todo se guarda en `sqlite.db` en la raíz del proyecto
   - No requiere conexión a internet
   - Funciona completamente offline

2. **Una Sola Empresa**
   - Nueva tabla `empresa` con datos por defecto
   - Todos los usuarios pertenecen a la misma empresa
   - Tabla de usuarios con roles (admin/empleado)

3. **Autenticación Simplificada**
   - Sistema de login sin registro público
   - Usuario admin y empleado creados automáticamente
   - Credenciales almacenadas en la base de datos local

4. **Eliminado**
   - ❌ Sistema de registro (`/registro`)
   - ❌ Login con Google
   - ❌ Recuperación de contraseña
   - ❌ Multitenancy (múltiples empresas)

---

## 🔐 Credenciales por Defecto

Se crean automáticamente en la primera ejecución:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@empresa.local | admin123 |
| Empleado | empleado@empresa.local | empleado123 |

⚠️ **Cambiar contraseñas en producción** - Estas son solo credenciales de demostración.

---

## 🚀 Cómo Usar

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ver en producción
npm run preview
```

### Acceso a la Aplicación

1. Abre el navegador en `http://localhost:5173`
2. Verás la pantalla de login
3. Usa las credenciales por defecto
4. ¡Listo! El sistema funciona sin internet

---

## 📁 Estructura de Datos

### Tablas en SQLite

#### `empresa`
- id (PK)
- nombre
- ruc
- direccion
- telefono
- email

#### `usuarios`
- id (PK)
- nombre
- email (UNIQUE)
- password
- rol (admin | empleado)

#### `productos`
- id (PK)
- sku (UNIQUE)
- nombre
- categoria
- precio
- stock
- estado (normal | bajo | sin)

---

## 🔧 Personalización

### Cambiar Nombre de la Empresa

Edita el archivo `src/db/index.ts` línea ~43:
```typescript
insertEmpresa.run(
  "Mi Empresa",  // ← Cambia aquí
  "000000000000",
  "Calle Principal 123",
  "+591 2 1234567",
  "empresa@ejemplo.com"
);
```

### Agregar/Modificar Usuarios

Edita el archivo `src/db/index.ts` línea ~48:
```typescript
// Agregar más usuarios aquí
insertUsuario.run("Nombre", "email@empresa.local", "password", "rol");
```

### Agregar Productos Iniciales

Edita el archivo `src/db/index.ts` línea ~60:
```typescript
const initialProducts = [
  // Agrega más productos aquí
];
```

---

## 🗄️ Gestión de Base de Datos

### Borrar y Reiniciar

Para volver a los datos iniciales:
1. Elimina el archivo `sqlite.db`
2. Reinicia la aplicación
3. Se recreará automáticamente con datos iniciales

### Acceder a la Base de Datos

Puedes usar herramientas como:
- **SQLite Browser** (Desktop)
- **DBeaver** (Desktop)
- **SQLiteOnline** (Web)

---

## ⚠️ Notas de Seguridad

Este sistema está diseñado para:
- ✅ Uso local/offline
- ✅ Una sola empresa
- ✅ Desarrollo y pequeñas operaciones

**No usar en producción online sin:**
1. Hashear contraseñas (bcrypt/argon2)
2. Implementar HTTPS
3. Agregar validaciones adicionales
4. Implementar backup automático

---

## 📝 Próximos Pasos

Si necesitas adicionar funcionalidades:

- [ ] Agregar módulo de reportes
- [ ] Agregar auditoría de cambios
- [ ] Agregar soporte multiusuario avanzado
- [ ] Agregar backup automático
- [ ] Agregar sincronización cuando hay internet

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisa los archivos en `src/`
2. Consulta la documentación de TanStack Router
3. Revisa la documentación de Drizzle ORM
