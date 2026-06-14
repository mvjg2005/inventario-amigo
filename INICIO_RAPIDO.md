# 🚀 Guía Rápida de Inicio

## Resumen de Cambios

Tu código ahora es un **sistema offline para una sola empresa** con login simplificado.

✅ **Funciona sin internet**  
✅ **Datos guardados localmente en SQLite**  
✅ **Una sola empresa por defecto**  
✅ **Login con usuarios predefinidos**  

---

## Inicio Rápido (3 pasos)

### 1️⃣ Ejecutar el servidor
```bash
npm install
npm run dev
```

### 2️⃣ Abrir en navegador
Abre: `http://localhost:5173`

### 3️⃣ Iniciar sesión
```
Email:      admin@empresa.local
Contraseña: admin123
```

**¡Listo!** Ya estás usando el sistema.

---

## 📚 Documentación

| Documento | Contenido |
|-----------|-----------|
| **OFFLINE_SETUP.md** | Guía completa de setup y características |
| **ADMINISTRACION_USUARIOS.md** | Cómo agregar/cambiar usuarios y contraseñas |

---

## 🎯 Credenciales por Defecto

Se crean automáticamente:

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Administrador | admin@empresa.local | admin123 | Admin |
| Empleado | empleado@empresa.local | empleado123 | Empleado |

---

## ⚙️ Personalización

### Cambiar nombre de empresa
Edita `src/db/index.ts` línea ~43:
```typescript
insertEmpresa.run("TU EMPRESA AQUÍ", ...);
```

### Agregar usuarios
Edita `src/db/index.ts` línea ~48:
```typescript
insertUsuario.run("Nombre", "email@empresa.local", "password", "rol");
```

### Limpiar base de datos
```bash
# Elimina el archivo de BD
rm sqlite.db

# Reinicia la aplicación - se recreará automáticamente
npm run dev
```

---

## 🗂️ Estructura de Carpetas

```
inventario-amigo/
├── src/
│   ├── db/              ← Base de datos SQLite
│   │   ├── index.ts     ← Configuración y datos iniciales
│   │   └── schema.ts    ← Estructura de tablas
│   ├── server/          ← Funciones del servidor
│   │   ├── auth.ts      ← Login/logout
│   │   └── productos.ts ← Operaciones de productos
│   └── routes/          ← Páginas de la aplicación
│       ├── login.tsx    ← Pantalla de login
│       └── ...
├── sqlite.db            ← Base de datos (se crea automáticamente)
└── OFFLINE_SETUP.md     ← Documentación completa
```

---

## 🔐 Cambiar Contraseña

### Rápido (GUI)
1. Abre `sqlite.db` con **DBeaver** o **SQLite Browser**
2. Tabla `usuarios` → Edita el campo `password`
3. Guarda

Ver: `ADMINISTRACION_USUARIOS.md` para más opciones.

---

## ⚡ Características Disponibles

✅ **Gestión de inventario**
- Productos con SKU, nombre, categoría, precio, stock
- Estados: normal, bajo, sin stock
- Búsqueda y filtrado

✅ **Panel de control**
- KPIs (productos totales, valor, rotación)
- Alertas de bajo stock
- Historial de movimientos

✅ **Seguridad**
- Login con email/contraseña
- Sesiones por cookies
- Roles (Admin/Empleado)

---

## 🎓 Próximos Pasos

1. **Personalizar empresa**
   - Cambiar nombre
   - Agregar teléfono, RUC, dirección

2. **Crear usuarios**
   - Agregar empleados según sea necesario
   - Ver: `ADMINISTRACION_USUARIOS.md`

3. **Cargar productos**
   - Los productos iniciales ya están cargados
   - Puedes agregarlos desde la UI o base de datos

4. **Hacer backup**
   - Copia `sqlite.db` regularmente
   - Esta es tu base de datos completa

---

## ❓ Preguntas Frecuentes

**¿Puedo usar esto sin internet?**  
✅ Sí, 100% offline.

**¿Dónde se guardan los datos?**  
📁 En el archivo `sqlite.db` en la raíz del proyecto.

**¿Puedo compartir la app con otros?**  
✅ Copia la carpeta del proyecto a otra computadora.  
⚠️ Los datos NO se sincronizan entre máquinas (cada una tiene su propia BD).

**¿Cómo reseteo todo?**  
🗑️ Elimina `sqlite.db` y reinicia.

**¿Puedo cambiar contraseñas?**  
✅ Ver: `ADMINISTRACION_USUARIOS.md`

**¿Es seguro para producción?**  
⚠️ No. Usa solo para desarrollo/demo local.  
Para producción: hash de contraseñas, HTTPS, backup, etc.

---

## 🆘 Problemas Comunes

### "No puedo iniciar sesión"
- Verifica: `admin@empresa.local` (minúsculas)
- Contraseña: `admin123`
- Revisa que `sqlite.db` exista

### "No veo los cambios"
- Reinicia el servidor: `npm run dev`
- Limpia cache del navegador: Ctrl+Shift+R

### "Base de datos corrupta"
- Elimina: `sqlite.db`
- Reinicia la app
- Se recreará automáticamente

---

**¡Tu sistema está listo!** 🎉  
Abre `http://localhost:5173` y comienza a usar StockPyme.
