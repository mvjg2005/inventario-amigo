export const DEMO_SESSION_TOKEN = "demo-session";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "admin@empresa.local",
  user_metadata: {
    nombre: "Usuario Demo",
    role: "admin",
  },
};

export function isDemoCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    (normalizedEmail === "admin@empresa.local" && password === "admin123") ||
    (normalizedEmail === "empleado@empresa.local" && password === "empleado123") ||
    (normalizedEmail === "demo@inventario-pymes.com" && password === "Demo2024!")
  );
}

export function isDemoSession(sessionCookie?: string | null) {
  return sessionCookie === DEMO_SESSION_TOKEN;
}

export const demoProducts = [
  { id: "1", sku: "ACV-001", nombre: "Aceite vegetal 1L", categoria: "Abarrotes", precio: 14.5, stock: 48, estado: "normal" },
  { id: "2", sku: "ARR-005", nombre: "Arroz grano largo 5kg", categoria: "Abarrotes", precio: 42, stock: 17, estado: "bajo" },
  { id: "3", sku: "LCH-012", nombre: "Leche entera 1L", categoria: "Lacteos", precio: 7.8, stock: 0, estado: "sin" },
  { id: "4", sku: "CAF-250", nombre: "Cafe molido 250g", categoria: "Bebidas", precio: 28.5, stock: 35, estado: "normal" },
  { id: "5", sku: "DET-900", nombre: "Detergente 900g", categoria: "Limpieza", precio: 18.9, stock: 12, estado: "bajo" },
] as const;

export const demoMovimientos = [
  { id: 1, producto: "Aceite vegetal 1L", sku: "ACV-001", tipo: "entrada", cantidad: 24, created_at: "2026-06-24T14:20:00Z" },
  { id: 2, producto: "Arroz grano largo 5kg", sku: "ARR-005", tipo: "salida", cantidad: 8, created_at: "2026-06-24T16:45:00Z" },
  { id: 3, producto: "Leche entera 1L", sku: "LCH-012", tipo: "salida", cantidad: 15, created_at: "2026-06-25T09:15:00Z" },
  { id: 4, producto: "Cafe molido 250g", sku: "CAF-250", tipo: "entrada", cantidad: 20, created_at: "2026-06-25T11:05:00Z" },
] as const;

export const demoOrdenes = [
  {
    id: 1,
    numero: "OC-1001",
    proveedor: "Distribuidora Central",
    items: 120,
    total: 1680,
    estado: "transito",
    created_at: "2026-06-23T10:00:00Z",
    detalles: [
      { producto: "Aceite vegetal 1L", paquetes: 10, unidades_por_paquete: 12, total_unidades: 120, precio_por_paquete: 168, subtotal: 1680 },
    ],
  },
  {
    id: 2,
    numero: "OC-1002",
    proveedor: "Lacteos del Valle",
    items: 60,
    total: 468,
    estado: "recibida",
    created_at: "2026-06-22T15:30:00Z",
    detalles: [
      { producto: "Leche entera 1L", paquetes: 5, unidades_por_paquete: 12, total_unidades: 60, precio_por_paquete: 93.6, subtotal: 468 },
    ],
  },
] as const;

export const demoFacturas = [
  { id: 1, numero: "F-001", cliente: "Tienda La Esquina", total_bs: 342.5, estado: "Pagada", fecha: "2026-06-24", created_at: "2026-06-24T17:00:00Z" },
  { id: 2, numero: "F-002", cliente: "Mini Market Sol", total_bs: 189.9, estado: "Pendiente", fecha: "2026-06-25", created_at: "2026-06-25T12:10:00Z" },
] as const;

export const demoTeamMembers = [
  { id: 1, nombre: "Ana Rojas", email: "ana.ventas@empresa.local", rol: "Vendedor", estado: "activo", created_at: "2026-06-20T10:00:00Z" },
  { id: 2, nombre: "Luis Perez", email: "luis.almacen@empresa.local", rol: "Almacen", estado: "pendiente", created_at: "2026-06-21T11:30:00Z" },
] as const;
