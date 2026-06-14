import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

const insertProducto = db.prepare(
  'INSERT INTO productos (sku, nombre, categoria, precio, stock, estado) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertUsuario = db.prepare(
  'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)'
);

const productos = [
  ['ACV-001', 'Aceite vegetal 1L', 'Abarrotes', 18.5, 142, 'normal'],
  ['AZR-050', 'Azúcar refinada 5Kg', 'Abarrotes', 42.0, 8, 'bajo'],
  ['DTL-200', 'Detergente líquido 2L', 'Limpieza', 35.0, 87, 'normal'],
  ['CFM-025', 'Café molido 250g', 'Bebidas', 28.0, 64, 'normal'],
  ['LCP-040', 'Leche en polvo 400g', 'Lácteos', 38.0, 0, 'sin'],
];

const user = ['Admin de prueba', 'admin@example.com', '123456'];

const tx = db.transaction(() => {
  for (const p of productos) {
    insertProducto.run(...p);
  }
  insertUsuario.run(...user);
});

tx();

console.log('Seed data inserted.');
console.log('productos count:', db.prepare('SELECT COUNT(*) AS count FROM productos').get());
console.log('usuarios count:', db.prepare('SELECT COUNT(*) AS count FROM usuarios').get());

db.close();
