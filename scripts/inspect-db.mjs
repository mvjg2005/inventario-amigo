import Database from 'better-sqlite3';

const db = new Database('sqlite.db', { readonly: true });

console.log('tables:');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all());
console.log('');
console.log('productos count:');
console.log(db.prepare('SELECT COUNT(*) AS count FROM productos').get());
console.log('usuarios count:');
console.log(db.prepare('SELECT COUNT(*) AS count FROM usuarios').get());
console.log('');
console.log('productos sample:');
console.log(db.prepare('SELECT * FROM productos LIMIT 5').all());
console.log('usuarios sample:');
console.log(db.prepare('SELECT * FROM usuarios LIMIT 5').all());

db.close();
