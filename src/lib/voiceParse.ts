/**
 * Parser de dictado por voz / texto en español (Bolivia).
 * Extrae cantidad, precio unitario y nombre de producto sin inventar precios.
 */

const UNIDADES = new Set([
  "cero", "un", "una", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintiun", "veintiún", "veintidos", "veintidós",
  "veintitres", "veintitrés", "veinticuatro", "veinticinco", "veintiseis", "veintiséis", "veintisiete",
  "veintiocho", "veintinueve", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta",
  "noventa", "cien", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos", "mil",
]);

const WORD_TO_NUM: Record<string, number> = {
  cero: 0,
  un: 1, una: 1, uno: 1,
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, dieciséis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20,
  veintiuno: 21, veintiun: 21, veintiún: 21,
  veintidos: 22, veintidós: 22,
  veintitres: 23, veintitrés: 23,
  veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintiséis: 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100,
  doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
  mil: 1000,
};

const CURRENCY_WORDS = /(?:bolivianos?|bs\.?|pesos?|dólares?|dolares?|usd|\$)/i;
const QTY_UNIT_WORDS = /(?:unidades?|kilos?|kg|litros?|lts?|cajas?|bolsas?|paquetes?|docenas?|piezas?|latas?|botellas?)/i;

/** Normaliza acentos leves y espacios */
export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parsea un token numérico: "12,50" | "12.5" | "cincuenta" | "veinticinco" */
export function parseNumberToken(raw: string): number | null {
  const t = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!t) return null;

  // dígitos con decimal
  if (/^\d+([.,]\d+)?$/.test(t)) {
    return parseFloat(t.replace(",", "."));
  }

  // "4 con 50" / "cuatro con cincuenta"
  const conMatch = t.match(/^(.+?)\s+con\s+(.+)$/);
  if (conMatch) {
    const entero = parseNumberToken(conMatch[1] ?? "");
    const dec = parseNumberToken(conMatch[2] ?? "");
    if (entero != null && dec != null) {
      const decStr = String(Math.trunc(dec)).padStart(2, "0").slice(0, 2);
      return parseFloat(`${Math.trunc(entero)}.${decStr}`);
    }
  }

  // compuestos: "treinta y cinco", "ciento veinte"
  if (t.includes(" y ") || t.includes(" ")) {
    const parts = t.split(/\s+y\s+|\s+/).filter(Boolean);
    let total = 0;
    let current = 0;
    for (const p of parts) {
      const v = WORD_TO_NUM[p];
      if (v == null) {
        // si hay dígitos mezclados
        if (/^\d+$/.test(p)) {
          current += parseInt(p, 10);
          continue;
        }
        return null;
      }
      if (v === 1000) {
        current = (current || 1) * 1000;
        total += current;
        current = 0;
      } else if (v >= 100) {
        current = (current || 1) * v;
      } else {
        current += v;
      }
    }
    total += current;
    return total > 0 || parts.includes("cero") ? total : null;
  }

  if (WORD_TO_NUM[t] != null) return WORD_TO_NUM[t];
  return null;
}

/**
 * Convierte palabras numéricas del texto a dígitos para facilitar regex posteriores.
 * "vendi diez panes a cuatro bs" → "vendi 10 panes a 4 bs"
 */
export function wordsToDigits(text: string): string {
  const t = normalizeSpeech(text);
  // "X con Y" decimales (4 con 50 → 4.50)
  let out = t.replace(
    /\b((?:\d+|[a-z]+(?:\s+y\s+[a-z]+)?))\s+con\s+(\d{1,2}|[a-z]+)\b/gi,
    (_m, a, b) => {
      const entero = parseNumberToken(a);
      const dec = parseNumberToken(b);
      if (entero == null || dec == null) return _m;
      const decStr = String(Math.trunc(dec)).padStart(2, "0").slice(0, 2);
      return `${Math.trunc(entero)}.${decStr}`;
    }
  );

  // compuestos "treinta y cinco"
  out = out.replace(
    /\b(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\s+y\s+(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/gi,
    (_m, dec, uni) => {
      const d = WORD_TO_NUM[dec.toLowerCase()] ?? 0;
      const u = WORD_TO_NUM[uni.toLowerCase()] ?? 0;
      return String(d + u);
    }
  );

  // "ciento X" / "cien"
  out = out.replace(
    /\b(ciento)\s+(veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve)\b/gi,
    (_m, _c, rest) => {
      const r = parseNumberToken(rest);
      return r != null ? String(100 + r) : _m;
    }
  );

  // palabras sueltas (más largas primero). Evitar convertir "un/una" dentro de
  // "a un precio" antes de que extractPrice lo vea — se maneja aparte.
  const sorted = Object.keys(WORD_TO_NUM)
    .filter((w) => w !== "un" && w !== "una" && w !== "uno")
    .sort((a, b) => b.length - a.length);
  for (const w of sorted) {
    const re = new RegExp(`\\b${w}\\b`, "gi");
    out = out.replace(re, String(WORD_TO_NUM[w]));
  }
  // un/una/uno solo como cantidad al inicio de segmento o tras verbo
  out = out.replace(/\b(un|una|uno)\b(?!\s+precio)/gi, "1");

  return out.replace(/\s+/g, " ").trim();
}

export interface PriceHit {
  value: number;
  /** índice de inicio en el texto normalizado con dígitos */
  index: number;
  /** longitud del match a remover del nombre */
  length: number;
  raw: string;
}

/**
 * Busca precio unitario en el texto.
 * Prioriza frases con moneda o preposiciones de precio.
 */
export function extractPrice(text: string): PriceHit | null {
  const t = wordsToDigits(text);

  const patterns: RegExp[] = [
    // "a un precio de 8 bs" / "precio de 8" / "precio unitario 8"
    /(?:a\s+un\s+)?precio(?:\s+unitario)?\s*(?:de\s*|:\s*)?(\d+(?:[.,]\d+)?)\s*(?:bolivianos?|bs\.?|pesos?|dolares?|usd|\$)?/i,
    // "cuesta 8" / "vale 8 bs" / "por 8 bs" / "a 8 bs" / "de 8 bolivianos"
    /(?:cuesta|vale|sale\s+a|a|por|de)\s+(\d+(?:[.,]\d+)?)\s*(?:bolivianos?|bs\.?|pesos?|dolares?|usd|\$)/i,
    // "8 bolivianos" / "8 bs" al final o tras producto
    /(\d+(?:[.,]\d+)?)\s*(?:bolivianos?|bs\.?|pesos?|dolares?|usd)\b/i,
    // "a 8" / "por 8" / "a Bs 8" (sin palabra de moneda después)
    /(?:a|por)\s*(?:bs\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?=$|,|\.|y\b|con\b|cliente\b|para\b)/i,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (m && m[1] != null && m.index != null) {
      const value = parseFloat(m[1].replace(",", "."));
      if (!Number.isFinite(value) || value < 0) continue;
      return { value, index: m.index, length: m[0].length, raw: m[0] };
    }
  }

  return null;
}

export interface QtyHit {
  value: number;
  index: number;
  length: number;
  raw: string;
}

/** Extrae cantidad (prioriza "N unidades/kilos" o el primer número que no sea el precio). */
export function extractQuantity(text: string, price?: PriceHit | null): QtyHit | null {
  const t = wordsToDigits(text);

  // "N unidades|kilos|..."
  const unitMatch = t.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${QTY_UNIT_WORDS.source}`, "i"));
  if (unitMatch && unitMatch.index != null) {
    const value = Math.max(1, Math.round(parseFloat(unitMatch[1]!.replace(",", "."))));
    return { value, index: unitMatch.index, length: unitMatch[0].length, raw: unitMatch[0] };
  }

  // "vendi N producto" — primer número del texto que no sea el precio
  const allNums = [...t.matchAll(/\d+(?:[.,]\d+)?/g)];
  for (const m of allNums) {
    if (m.index == null) continue;
    // Si cae dentro del span del precio, saltar
    if (price && m.index >= price.index && m.index < price.index + price.length) continue;
    // Si el número es decimal y parece precio (ej 12.50) y está cerca de moneda, saltar
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 12);
    if (CURRENCY_WORDS.test(after)) continue;
    const value = Math.max(1, Math.round(parseFloat(m[0].replace(",", "."))));
    return { value, index: m.index, length: m[0].length, raw: m[0] };
  }

  // palabras residuales un/una ya convertidas a 1
  if (/\b(1)\b/.test(t) || /\bun\b|\buna\b|\buno\b/.test(normalizeSpeech(text))) {
    // solo si no hay otro número — default 1
  }

  return null;
}

const VERB_START =
  /^(vend[iíeéoó]|vendiendo|venta|compre|compré|compra|compras|comprando|compro|compró|entro|entró|entrada|entrando|salida|sali|salió|salio|recibi|recibí|recibio|recibió|despache|despach[eéó]|ingreso|ingresó|ingresando|gasto|registre|registr[eé]|anota|anot[eé])\s+/i;

const STOP_WORDS =
  /\b(unidades?|kilos?|kg|litros?|lts?|cajas?|bolsas?|paquetes?|docenas?|piezas?|latas?|botellas?|de|del|la|el|los|las|unos|unas|al|a|por|precio|unitario|bs|bolivianos?|pesos?|dolares?|usd|cliente|factura|venta|compra|entrada|salida)\b/gi;

export interface ParsedVoiceCommand {
  producto: string;
  cantidad: number;
  precio: number;
  precioDetectado: boolean;
  tipo: "entrada" | "salida";
  rawNormalized: string;
}

export function detectarTipoMovimiento(text: string): "entrada" | "salida" | null {
  const t = normalizeSpeech(text);
  const esEntrada = /\b(compre|compre|compra|compras|comprando|compro|compro|compramos|entrada|entro|entro|entrando|recibi|recibio|recibiendo|ingreso|ingreso|ingresando|llego|llego|reponer|reponiendo)\b/.test(t)
    || /compr[eéoóa]|entr[aáoó]|recib|ingres|lleg[oó]|repon/.test(t);
  const esSalida = /\b(vendi|vende|vendio|vendiendo|venta|ventas|salida|salio|saliendo|despache|despacho|retire|retiro|gasto)\b/.test(t)
    || /vend[iíeéoó]|sali[oó]|despach|retir|gasto|salida|venta/.test(t);
  if (esEntrada && !esSalida) return "entrada";
  if (esSalida && !esEntrada) return "salida";
  if (esEntrada) return "entrada";
  if (esSalida) return "salida";
  return null;
}

/** Limpia el nombre del producto quitando verbos, cantidades y precios. */
export function extractProductName(text: string, qty?: QtyHit | null, price?: PriceHit | null): string {
  let t = wordsToDigits(text);

  if (price) {
    t = t.slice(0, price.index) + " " + t.slice(price.index + price.length);
  }
  // quitar cualquier resto de precio/moneda
  t = t
    .replace(/(?:a\s+un\s+)?precio(?:\s+unitario)?\s*(?:de\s*|:\s*)?\d+(?:[.,]\d+)?\s*(?:bolivianos?|bs\.?|pesos?|dolares?|usd)?/gi, " ")
    .replace(/(?:cuesta|vale|sale\s+a|a|por|de)\s+\d+(?:[.,]\d+)?\s*(?:bolivianos?|bs\.?|pesos?|dolares?|usd)?/gi, " ")
    .replace(/\d+(?:[.,]\d+)?\s*(?:bolivianos?|bs\.?|pesos?|dolares?|usd)\b/gi, " ");

  if (qty) {
    // re-localizar cantidad en el string ya modificado (mejor quitar por patrón)
    t = t.replace(new RegExp(`\\b${qty.value}\\b\\s*${QTY_UNIT_WORDS.source}?`, "i"), " ");
  }
  t = t.replace(/^\d+(?:[.,]\d+)?\s*/i, " ");

  t = t
    .replace(VERB_START, " ")
    .replace(/\b(cliente|para)\s+[a-z\s]+$/i, " ")
    .replace(STOP_WORDS, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!t) return "";

  return t
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Parsea un comando simple de movimiento: "vendí 10 panes a 4 bs"
 */
export function parseMovimientoVoice(text: string): ParsedVoiceCommand | null {
  const rawNormalized = wordsToDigits(text);
  if (!rawNormalized) return null;

  const tipo = detectarTipoMovimiento(text) ?? "salida";
  const price = extractPrice(text);
  const qty = extractQuantity(text, price);
  const cantidad = qty?.value ?? 1;
  const precio = price?.value ?? 0;
  const producto = extractProductName(text, qty, price);

  if (!producto || producto.length < 2) return null;

  return {
    producto,
    cantidad,
    precio,
    precioDetectado: price != null && precio > 0,
    tipo,
    rawNormalized,
  };
}

/**
 * Extrae precio de un fragmento de línea de factura (p.ej. "3 panes a 2 bs").
 * Si no hay precio hablado, devuelve 0 (el caller usa catálogo o pide al usuario).
 */
export function parseLineaProducto(part: string): { nombre: string; cantidad: number; precio: number; precioDetectado: boolean } {
  const price = extractPrice(part);
  const qty = extractQuantity(part, price);
  let cantidad = qty?.value ?? 1;

  // "una mayonesa" sin dígitos
  if (!qty && /\b(un|una|uno)\b/i.test(normalizeSpeech(part))) cantidad = 1;

  const nombre = extractProductName(part, qty, price);
  return {
    nombre,
    cantidad,
    precio: price?.value ?? 0,
    precioDetectado: price != null && (price.value ?? 0) > 0,
  };
}

export function generarSku(nombre: string): string {
  const clean = nombre
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean);
  const prefijo = clean.map((p) => p.slice(0, 3)).join("").slice(0, 6);
  return `${prefijo || "PRD"}-${Math.floor(Math.random() * 900) + 100}`;
}
