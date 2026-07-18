/**
 * Prueba rápida del parser de voz (copia de lógica clave vía import dinámico no-TS).
 * Ejecutar: node scripts/test-voice-parse.mjs
 * Para validar el módulo real usar el build o vite-node si está disponible.
 */

// Inline minimal re-export test through dynamic import of built sources isn't available;
// we spawn a tiny TypeScript transpile via the project's existing deps if possible.

import { createRequire } from "module";
import { pathToFileURL } from "url";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { transformSync } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../src/lib/voiceParse.ts");
const code = readFileSync(src, "utf8");
const { code: js } = transformSync(code, { loader: "ts", format: "esm" });
const tmp = join(__dirname, "_voiceParse.tmp.mjs");
writeFileSync(tmp, js);

const mod = await import(pathToFileURL(tmp).href);
unlinkSync(tmp);

const cases = [
  "vendí 10 panes a 4 bolivianos",
  "compré 20 litros de aceite a 15 bs",
  "vendí diez panes a cuatro bolivianos",
  "compré coca cola a un precio de 8 bs",
  "comprando arroz a 50 bs",
  "compré arroz a 50 bs",
  "vendí pan a cincuenta bolivianos",
  "entrada de 5 kilos de arroz a 12,50",
  "compré 3 leches a 7.80",
  "vendí 6 huevos",
];

let failed = 0;
for (const c of cases) {
  const r = mod.parseMovimientoVoice(c);
  console.log(JSON.stringify(r), "<-", c);
  if (!r) {
    failed++;
    continue;
  }
}

// Expectaciones críticas
const checks = [
  { t: "compré arroz a 50 bs", precio: 50, cantidad: 1 },
  { t: "vendí 10 panes a 4 bolivianos", precio: 4, cantidad: 10 },
  { t: "vendí pan a cincuenta bolivianos", precio: 50, cantidad: 1 },
  { t: "compré coca cola a un precio de 8 bs", precio: 8, cantidad: 1 },
  { t: "vendí diez panes a cuatro bolivianos", precio: 4, cantidad: 10 },
];

console.log("\n=== CHECKS ===");
for (const { t, precio, cantidad } of checks) {
  const r = mod.parseMovimientoVoice(t);
  const ok = r && r.precio === precio && r.cantidad === cantidad;
  console.log(ok ? "OK" : "FAIL", t, "=>", r);
  if (!ok) failed++;
}

process.exit(failed > 0 ? 1 : 0);
