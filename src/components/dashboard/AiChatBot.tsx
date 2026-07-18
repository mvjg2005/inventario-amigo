import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Loader2, 
  CheckCircle, 
  RefreshCw, 
  X, 
  FileText, 
  Printer, 
  ShoppingCart, 
  ArrowLeftRight,
  User as UserIcon,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "@tanstack/react-router";
import { getProductsFn, createProductFn, updateProductFn } from "@/routes/productos.server";
import { createFacturaFn } from "@/routes/facturas.server";
import { createMovimientoFn } from "@/routes/movimientos.server";
import { createOrdenFn } from "@/routes/ordenes.server";
import { imprimirFactura } from "@/lib/imprimirFactura";
import {
  extractPrice,
  generarSku,
  parseLineaProducto,
  parseMovimientoVoice,
  wordsToDigits,
} from "@/lib/voiceParse";
import { loadSystemPrefs } from "@/lib/systemPrefs";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  intent?: {
    type: "factura" | "movimiento" | "orden";
    data: any;
    confirmed?: boolean;
  };
}

const CATEGORIAS_IA: Record<string, string[]> = {
  "Panadería": ["pan", "marraqueta", "galleta", "torta", "bizcocho", "empanada", "croissant"],
  "Lácteos": ["leche", "queso", "yogur", "mantequilla", "crema"],
  "Bebidas": ["agua", "refresco", "jugo", "gaseosa", "cerveza", "vino", "café", "chicha", "té"],
  "Granos": ["arroz", "azúcar", "harina", "frijol", "lenteja", "maíz", "quinua", "chuño"],
  "Aceites": ["aceite", "vinagre", "margarina"],
  "Carnes": ["pollo", "carne", "res", "cerdo", "chancho", "pescado", "chorizo"],
  "Frutas": ["manzana", "naranja", "plátano", "banana", "uva", "pera", "durazno", "mango"],
  "Verduras": ["tomate", "cebolla", "papa", "zanahoria", "lechuga", "pepino", "ajo"],
  "Limpieza": ["detergente", "jabón", "cloro", "lejía", "esponja", "escoba"],
  "Snacks": ["papas fritas", "chicle", "caramelo", "chocolate", "chipa"],
  "Condimentos": ["sal", "pimienta", "comino", "orégano", "mostaza", "ketchup", "mayonesa"],
};

function detectarCategoria(texto: string): string {
  const lower = texto.toLowerCase();
  for (const [cat, palabras] of Object.entries(CATEGORIAS_IA)) {
    if (palabras.some(p => lower.includes(p))) return cat;
  }
  return "General";
}

/** Empareja nombre dictado con catálogo (exacto > incluye). */
function matchProducto(nombre: string, productosExistentes: any[]) {
  const n = nombre.toLowerCase().trim();
  if (!n) return null;
  const exact = productosExistentes.find((p) => p.nombre?.toLowerCase() === n);
  if (exact) return exact;
  const partial = productosExistentes.filter(
    (p) => p.nombre?.toLowerCase().includes(n) || n.includes(p.nombre?.toLowerCase() ?? "")
  );
  if (partial.length === 1) return partial[0];
  // preferir el de nombre más corto (más específico)
  if (partial.length > 1) {
    return [...partial].sort((a, b) => a.nombre.length - b.nombre.length)[0];
  }
  return null;
}

/**
 * Resuelve precio real:
 * 1) precio dicho por voz
 * 2) precio del catálogo si el producto existe
 * 3) 0 (el usuario debe completarlo — nunca inventamos 5/10/50)
 */
function resolverPrecio(precioVoz: number, precioDetectado: boolean, catalogPrecio?: number | null) {
  if (precioDetectado && precioVoz > 0) return { precio: precioVoz, fuente: "voz" as const };
  if (catalogPrecio != null && Number(catalogPrecio) > 0) {
    return { precio: Number(catalogPrecio), fuente: "catalogo" as const };
  }
  return { precio: 0, fuente: "pendiente" as const };
}

export function AiChatBot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "¡Hola! Soy Stocky 🤖, tu asistente de inventario.\n\nRegistro compras, ventas y órdenes con precio real (sin valores inventados).\n\n*Ejemplos de dictado:*\n• *\"Compré 10 arroz a 50 bolivianos\"*\n• *\"Vendí 6 panes a 2 bs\"*\n• *\"Compré coca cola a un precio de 8 bs\"*\n• *\"Vendí 3 leches y 2 yogures al cliente Juan\"*",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Cargar lista de productos para emparejamiento de facturas y movimientos
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const prods = await getProductsFn();
        setProductos(prods || []);
      } catch (err) {
        console.error("Error al cargar productos para el chatbot:", err);
      }
    };
    cargarProductos();
  }, [isOpen]);

  // Desplazar automáticamente al fondo al recibir mensajes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const parseComando = (texto: string, productosExistentes: any[]): { type: "factura" | "movimiento" | "orden" | "unknown"; data?: any } => {
    const cleanText = texto.toLowerCase().trim();
    const digitText = wordsToDigits(texto);

    // 1. ORDEN DE COMPRA (prioridad alta — palabras de proveedor/pedido)
    const isOrden = /orden|proveedor|pedido|pedi|pedí|de don|del proveedor/i.test(cleanText)
      || /(?:crear|nueva)\s+orden/i.test(cleanText);
    if (isOrden) {
      let proveedor = "Proveedor General";
      const provPatterns = [
        /(?:de don|de mi proveedor|del proveedor|al proveedor|proveedor)\s+([a-záéíóúñ][a-záéíóúñ\s]{1,30}?)(?:\s+(?:con|de|todo|por|$))/i,
        /(?:de don|de mi proveedor|del proveedor|al proveedor|proveedor)\s+([a-záéíóúñ][a-záéíóúñ\s]{1,30}?)$/i,
        /(?:proveedor|al)\s+([A-Z][A-Za-zÁÉÍÓÚÑ\s]{1,20})/,
      ];
      for (const pat of provPatterns) {
        const m = cleanText.match(pat);
        if (m?.[1]) {
          proveedor = m[1].trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          break;
        }
      }

      const lineasOrden: any[] = [];
      const segmentos = digitText.split(/,|\bluego\b|\btambien\b|\bademas\b|\by ademas\b/i);

      segmentos.forEach(seg => {
        const s = seg.trim();
        const pat1 = /(\d+)\s*paquetes?\s+de\s+([a-záéíóúñ\s]+?)\s+de\s+(\d+)\s*unidades?\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;
        const pat2 = /(\d+)\s*paquetes?\s+de\s+([a-záéíóúñ\s]+?)\s*\(?\s*(\d+)\s*unidades?\s*\)?\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;
        const pat3 = /(\d+)\s*paquetes?\s+de\s+([a-záéíóúñ\s]+?)\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;

        let m = s.match(pat1) || s.match(pat2);
        if (m) {
          lineasOrden.push({
            producto: m[2].trim().split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            paquetes: parseInt(m[1]),
            unidadesPorPaquete: parseInt(m[3]),
            precioPorPaquete: parseFloat(m[4].replace(",", ".")),
          });
          return;
        }
        m = s.match(pat3);
        if (m) {
          lineasOrden.push({
            producto: m[2].trim().split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            paquetes: parseInt(m[1]),
            unidadesPorPaquete: 1,
            precioPorPaquete: parseFloat(m[3].replace(",", ".")),
          });
          return;
        }
        // Línea simple con precio: "15 coca cola a 8 bs"
        const linea = parseLineaProducto(s);
        if (linea.nombre.length >= 2) {
          lineasOrden.push({
            producto: linea.nombre,
            paquetes: linea.cantidad,
            unidadesPorPaquete: 1,
            precioPorPaquete: linea.precio,
          });
        }
      });

      if (lineasOrden.length === 0) {
        const priceHit = extractPrice(texto);
        lineasOrden.push({
          producto: "Producto General",
          paquetes: 1,
          unidadesPorPaquete: 1,
          precioPorPaquete: priceHit?.value ?? 0,
        });
      }

      const totalOrden = lineasOrden.reduce((acc, l) => acc + l.paquetes * l.precioPorPaquete, 0);
      const totalUnidades = lineasOrden.reduce((acc, l) => acc + l.paquetes * l.unidadesPorPaquete, 0);

      return {
        type: "orden",
        data: {
          proveedor,
          items: totalUnidades,
          total: totalOrden,
          estado: "pendiente",
          lineas: lineasOrden,
        }
      };
    }

    // 2. FACTURA / VENTA (explícita o venta a cliente / multi-ítem)
    const mencionaCliente = /(?:cliente|para)\s+[a-záéíóúñ]/i.test(cleanText);
    const mencionaFactura = /factura|comprobante|ticket/i.test(cleanText);
    const esVenta = /vend[iíeé]|venta/i.test(cleanText);
    const multiItem = /,|\by\b/.test(cleanText) && esVenta;
    const isFactura = mencionaFactura || mencionaCliente || multiItem
      || (esVenta && /cliente|para\s+[a-z]/i.test(cleanText));

    // Venta simple de 1 producto → preferir movimiento (más control de precio/stock)
    // a menos que diga factura/cliente
    if (isFactura || (esVenta && (mencionaFactura || mencionaCliente || multiItem))) {
      let cliente = "Cliente General";
      const clienteMatch = cleanText.match(/(?:cliente|para)\s+([a-záéíóúñ\s]+?)(?:\s+me\s+compro|\s+compro|\s+compró|\s+compr|:|$|\d+)/i);
      if (clienteMatch?.[1]) {
        cliente = clienteMatch[1].trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }

      // Quitar prefijo de cliente del texto de productos
      let productosText = digitText
        .replace(/(?:cliente|para)\s+[a-záéíóúñ\s]+?(?=\s+\d|\s+un|\s+una|,|$)/i, " ")
        .replace(/\b(factura|comprobante|ticket|vendi|vende|vendio|venta)\b/gi, " ");

      const partes = productosText.split(/,|\by\b|\be\b/).map(p => p.trim()).filter(Boolean);
      const detalles: any[] = [];
      let totalBs = 0;
      let preciosPendientes = 0;

      for (const part of partes) {
        const linea = parseLineaProducto(part);
        if (linea.nombre.length < 2) continue;

        const matchedProd = matchProducto(linea.nombre, productosExistentes);
        const { precio: precioUnitario, fuente } = resolverPrecio(
          linea.precio,
          linea.precioDetectado,
          matchedProd?.precio
        );
        if (fuente === "pendiente") preciosPendientes++;

        const sku = matchedProd ? matchedProd.sku : generarSku(linea.nombre);
        const subtotal = linea.cantidad * precioUnitario;
        totalBs += subtotal;

        detalles.push({
          producto: matchedProd ? matchedProd.nombre : linea.nombre,
          sku,
          cantidad: linea.cantidad,
          precio_unitario: precioUnitario,
          subtotal,
          existe: !!matchedProd,
          originalId: matchedProd ? matchedProd.id : null,
          currentStock: matchedProd ? matchedProd.stock : 0,
          precioFuente: fuente,
        });
      }

      if (detalles.length === 0) {
        // caer a movimiento simple
      } else {
        return {
          type: "factura",
          data: {
            cliente,
            total_bs: totalBs,
            estado: "Pagada",
            detalles,
            preciosPendientes,
          }
        };
      }
    }

    // 3. MOVIMIENTO (compra/entrada/salida/venta simple)
    const mov = parseMovimientoVoice(texto);
    if (mov) {
      const matchedProd = matchProducto(mov.producto, productosExistentes);
      const { precio, fuente } = resolverPrecio(
        mov.precio,
        mov.precioDetectado,
        matchedProd?.precio
      );
      const sku = matchedProd ? matchedProd.sku : generarSku(mov.producto);
      const categoria = matchedProd?.categoria || detectarCategoria(mov.producto);

      return {
        type: "movimiento",
        data: {
          producto: matchedProd ? matchedProd.nombre : mov.producto,
          sku,
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          precio,
          precioFuente: fuente,
          categoria,
          productId: matchedProd?.id ?? null,
          currentStock: matchedProd?.stock ?? 0,
          existe: !!matchedProd,
        }
      };
    }

    return { type: "unknown" };
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Agregar mensaje del usuario
    const userMsgId = "msg-" + Date.now();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!textToSend) setInputValue("");
    setIsProcessing(true);

    // Procesamiento
    setTimeout(() => {
      const intent = parseComando(text, productos);
      const prefs = loadSystemPrefs();
      const replyId = "reply-" + Date.now();

      let assistantMsg: Message;
      /** Si la validación está OFF y hay datos suficientes, registrar sin pedir clic. */
      let autoRegistrarMovimiento: { msgId: string; data: any } | null = null;

      if (intent.type === "factura") {
        assistantMsg = {
          id: replyId,
          sender: "assistant",
          text: `He estructurado la siguiente factura basándome en el inventario actual. ¿Deseas guardarla y generar el comprobante?`,
          timestamp: new Date(),
          intent: intent as any,
        };
      } else if (intent.type === "movimiento") {
        const data = intent.data ?? {};
        const precio = Number(data.precio) || 0;
        const existe = Boolean(
          data.existe ||
            productos.some(
              (p) =>
                p.sku === data.sku ||
                p.nombre?.toLowerCase() === String(data.producto || "").toLowerCase(),
            ),
        );
        // Sin validación: auto-registrar si el producto ya existe o ya hay precio
        const puedeAuto =
          !prefs.validacionMovimientos && (existe || precio > 0) && Number(data.cantidad) > 0;

        if (puedeAuto) {
          assistantMsg = {
            id: replyId,
            sender: "assistant",
            text: `Registrando movimiento sin confirmación (validación desactivada)…`,
            timestamp: new Date(),
            intent: { ...(intent as any), data: { ...data, existe } },
          };
          autoRegistrarMovimiento = { msgId: replyId, data: { ...data, existe } };
        } else {
          assistantMsg = {
            id: replyId,
            sender: "assistant",
            text: prefs.validacionMovimientos
              ? `He estructurado el siguiente movimiento de inventario. Revisa los datos y confirma el registro.`
              : `Faltan datos (p. ej. precio del producto nuevo). Completa y registra el movimiento.`,
            timestamp: new Date(),
            intent: intent as any,
          };
        }
      } else if (intent.type === "orden") {
        assistantMsg = {
          id: replyId,
          sender: "assistant",
          text: `He estructurado la siguiente orden de compra. ¿Confirmas el registro?`,
          timestamp: new Date(),
          intent: intent as any,
        };
      } else {
        assistantMsg = {
          id: replyId,
          sender: "assistant",
          text: "No estoy seguro de haber entendido. ¿Podrías intentar expresarlo de otra forma? Recuerda que puedo:\n- Generar facturas (ej. *'vendi 3 panes'*)\n- Registrar movimientos (ej. *'compré 10 leches a 5 bs'*)\n- Crear órdenes de compra (ej. *'orden de compra a PIL'*).",
          timestamp: new Date(),
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);

      if (autoRegistrarMovimiento) {
        // Pequeño delay para que el mensaje quede en el historial antes de confirmar
        setTimeout(() => {
          void handleConfirmMovimiento(
            autoRegistrarMovimiento!.msgId,
            autoRegistrarMovimiento!.data,
          );
        }, 50);
      }
    }, 600);
  };

  // 🎙️ Reconocimiento de Voz
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    if (window.location.protocol === "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      toast.error("El micrófono requiere una conexión segura (HTTPS) o acceder vía 'localhost' en esta PC.");
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error("El reconocimiento de voz no está soportado en este navegador. Te recomendamos usar Google Chrome o Microsoft Edge.");
      return;
    }

    const rec = new SpeechRec();
    // es-BO mejora números y moneda boliviana; fallback es-ES
    rec.lang = "es-BO";
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    recognitionRef.current = rec;

    let finalTranscript = "";
    let sent = false;
    setIsListening(true);
    toast.info('Escuchando… Di p.ej.: "Compré 10 arroz a 50 bolivianos"');

    const finishWith = (text: string) => {
      const t = text.trim();
      if (!t || sent) return;
      sent = true;
      setIsListening(false);
      setInputValue(t);
      try { rec.stop(); } catch { /* ignore */ }
      handleSend(t);
    };

    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const alt = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + alt;
        } else {
          interim += alt;
        }
      }
      const shown = (finalTranscript || interim).trim();
      if (shown) setInputValue(shown);

      if (finalTranscript.trim()) {
        finishWith(finalTranscript);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (!sent && finalTranscript.trim()) finishWith(finalTranscript);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      if (e.error === "not-allowed") {
        toast.error("Permiso de micrófono denegado. Haz clic en el candado en la barra de direcciones del navegador y permite el uso del micrófono.");
      } else if (e.error === "network") {
        toast.error("Error de conexión. El reconocimiento de voz de Google requiere conexión a internet activa.");
      } else if (e.error === "no-speech") {
        toast.warning("No detecté tu voz. Habla claro y de cerca al micrófono.");
      } else {
        toast.error(`Error de micrófono: ${e.error}`);
      }
    };

    try {
      rec.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      toast.error(`No se pudo iniciar el micrófono: ${err.message || err}`);
    }
  };

  // Confirmar Factura
  const handleConfirmFactura = async (msgId: string, data: any) => {
    const sinPrecio = (data.detalles || []).filter((d: any) => !d.precio_unitario || Number(d.precio_unitario) <= 0);
    if (sinPrecio.length > 0) {
      toast.error(`Falta el precio de: ${sinPrecio.map((d: any) => d.producto).join(", ")}. Complétalo antes de registrar.`);
      return;
    }

    setIsProcessing(true);
    try {
      const totalBs = (data.detalles || []).reduce(
        (acc: number, d: any) => acc + Number(d.cantidad) * Number(d.precio_unitario),
        0
      );

      await createFacturaFn({
        data: {
          cliente: data.cliente,
          total_bs: totalBs,
          estado: data.estado,
          detalles: data.detalles
        }
      } as any);

      for (const item of data.detalles) {
        await createMovimientoFn({
          data: {
            producto: item.producto,
            sku: item.sku,
            tipo: "salida",
            cantidad: item.cantidad
          }
        } as any);

        if (item.existe && item.originalId) {
          const nuevoStock = Math.max(0, item.currentStock - item.cantidad);
          const estado = nuevoStock === 0 ? "sin" : nuevoStock <= 20 ? "bajo" : "normal";

          await updateProductFn({
            data: {
              id: item.originalId,
              stock: nuevoStock,
              estado,
              // Si el usuario dictó un precio, actualizar catálogo
              ...(Number(item.precio_unitario) > 0 ? { precio: Number(item.precio_unitario) } : {}),
            }
          } as any);
        } else if (Number(item.precio_unitario) > 0) {
          // Producto nuevo vendido: crearlo con stock 0 y el precio real
          try {
            await createProductFn({
              data: {
                sku: item.sku,
                nombre: item.producto,
                categoria: detectarCategoria(item.producto),
                precio: Number(item.precio_unitario),
                stock: 0,
                estado: "sin",
              }
            } as any);
          } catch {
            // SKU duplicado u otro error — no bloquear la factura
          }
        }
      }

      toast.success("Factura generada y stock actualizado en Supabase.");

      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.intent) {
          return {
            ...m,
            text: `¡Factura generada correctamente! Factura para **${data.cliente}** por un total de **Bs ${totalBs.toFixed(2)}**.`,
            intent: { ...m.intent, confirmed: true, data: { ...data, total_bs: totalBs } }
          };
        }
        return m;
      }));

      const updatedProds = await getProductsFn();
      setProductos(updatedProds || []);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Error al generar la factura");
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar Movimiento
  const handleConfirmMovimiento = async (msgId: string, data: any) => {
    const precio = Number(data.precio) || 0;
    const matches = productos.filter(
      p => p.sku === data.sku || p.nombre.toLowerCase() === data.producto.toLowerCase()
    );
    const existe = matches.length > 0;

    // Producto nuevo: exigir precio real (no inventar 5/10/50)
    if (!existe && precio <= 0) {
      toast.error("Indica el precio unitario (Bs) del producto nuevo antes de registrar.");
      return;
    }

    setIsProcessing(true);
    try {
      await createMovimientoFn({
        data: {
          producto: data.producto,
          sku: data.sku,
          tipo: data.tipo,
          cantidad: data.cantidad
        }
      } as any);

      if (existe) {
        const prod = matches[0];
        const nuevoStock = data.tipo === "entrada"
          ? Number(prod.stock) + Number(data.cantidad)
          : Math.max(0, Number(prod.stock) - Number(data.cantidad));
        const estado = nuevoStock === 0 ? "sin" : nuevoStock <= 20 ? "bajo" : "normal";

        await updateProductFn({
          data: {
            id: prod.id,
            stock: nuevoStock,
            estado,
            // Actualizar precio del catálogo si el usuario lo indicó
            ...(precio > 0 ? { precio } : {}),
          }
        } as any);
      } else {
        const stockInicial = data.tipo === "entrada" ? Number(data.cantidad) : 0;
        const estado = stockInicial === 0 ? "sin" : stockInicial <= 20 ? "bajo" : "normal";

        await createProductFn({
          data: {
            sku: data.sku,
            nombre: data.producto,
            categoria: data.categoria,
            precio,
            stock: stockInicial,
            estado
          }
        } as any);
      }

      toast.success(
        precio > 0
          ? `Movimiento registrado · ${data.producto} · Bs ${precio.toFixed(2)} c/u`
          : "Movimiento registrado y stock actualizado."
      );

      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.intent) {
          return {
            ...m,
            text: `¡Movimiento registrado! **${data.tipo === "entrada" ? "Entrada" : "Salida"}** de **${data.cantidad}** × **${data.producto}**${precio > 0 ? ` a **Bs ${precio.toFixed(2)}**` : ""}.`,
            intent: { ...m.intent, confirmed: true }
          };
        }
        return m;
      }));

      const updatedProds = await getProductsFn();
      setProductos(updatedProds || []);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar movimiento");
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar Orden
  const handleConfirmOrden = async (msgId: string, data: any) => {
    setIsProcessing(true);
    try {
      const lineas = data.lineas ?? [];
      const detalles = lineas.map((l: any) => ({
        producto: l.producto,
        paquetes: l.paquetes,
        unidades_por_paquete: l.unidadesPorPaquete,
        total_unidades: l.paquetes * l.unidadesPorPaquete,
        precio_por_paquete: l.precioPorPaquete,
        subtotal: l.paquetes * l.precioPorPaquete,
      }));

      await createOrdenFn({
        data: {
          proveedor: data.proveedor,
          items: data.items,
          total: data.total,
          estado: data.estado,
          detalles: detalles.length > 0 ? detalles : null,
        }
      } as any);

      toast.success("Orden de compra creada con éxito.");

      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.intent) {
          return {
            ...m,
            text: `¡Orden de compra generada! Orden a **${data.proveedor}** — ${lineas.length} producto(s) — **${data.items} unidades** — Total **Bs ${Number(data.total).toFixed(2)}**.`,
            intent: { ...m.intent, confirmed: true }
          };
        }
        return m;
      }));

      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar la orden");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Botón Flotante Global */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "safe-bottom fixed right-3 z-40 h-12 w-12 rounded-full shadow-2xl transition-all duration-300 sm:right-6 sm:h-14 sm:w-14",
          isOpen ? "bg-rose-500 hover:bg-rose-600 rotate-90 scale-90" : "bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
        )}
        title="Asistente de IA Stocky"
      >
        {isOpen ? <X className="h-5 w-5 text-white sm:h-6 sm:w-6" /> : <Sparkles className="h-5 w-5 text-white animate-pulse sm:h-6 sm:w-6" />}
      </Button>

      {/* Ventana de Chat — casi pantalla completa en móvil */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] top-14 z-40 flex flex-col rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[min(550px,calc(100dvh-7rem))] sm:w-[min(380px,calc(100vw-1.5rem))]">
          
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-none">Stocky AI</h3>
              <span className="mt-1 flex items-center gap-1 truncate text-[10px] text-indigo-100">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-ping" /> Activo • Dictado de voz disponible
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Historial de Mensajes */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-muted/20 p-3 sm:p-4">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              const intent = msg.intent;
              return (
                <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", isAssistant ? "self-start" : "ml-auto flex-row-reverse")}>
                  {isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line shadow-sm",
                        isAssistant
                          ? "bg-popover border border-border text-foreground rounded-tl-none"
                          : "bg-indigo-600 text-white rounded-tr-none"
                      )}
                    >
                      {msg.text}
                    </div>

                    {/* TARJETA INTERACTIVA DE ACCION (INTENTOS) */}
                    {isAssistant && intent && !intent.confirmed && (
                      <div className="rounded-xl border border-indigo-100 bg-white dark:bg-zinc-950 p-4 shadow-md space-y-4 mt-2">
                        
                        {/* 📄 CASO FACTURA */}
                        {intent.type === "factura" && (
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-400 border-b pb-2">
                              <FileText className="h-4 w-4 text-indigo-600" /> Generar Venta / Factura
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Cliente / Razón Social</Label>
                              <Input 
                                size={1}
                                className="h-7 text-xs"
                                value={intent.data.cliente}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                    ...m,
                                    intent: { ...m.intent, data: { ...m.intent.data, cliente: val } }
                                  } : m));
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Productos (cant. × precio Bs)</Label>
                              {(intent.data.detalles || []).some((d: any) => !d.precio_unitario || Number(d.precio_unitario) <= 0) && (
                                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                  ⚠ Falta precio en uno o más productos. Complétalo para registrar la venta real.
                                </p>
                              )}
                              <div className="max-h-40 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-muted/10">
                                {intent.data.detalles.map((det: any, idx: number) => (
                                  <div key={idx} className="flex flex-col gap-1 py-1 border-b last:border-0">
                                    <div className="min-w-0">
                                      <span className="font-medium truncate block text-[11px]">{det.producto}</span>
                                      <span className="text-[9px] text-muted-foreground block">
                                        Stock: {det.currentStock}{det.existe ? "" : " · nuevo"}
                                        {det.precioFuente === "voz" ? " · precio por voz" : det.precioFuente === "catalogo" ? " · precio catálogo" : " · precio pendiente"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        min={1}
                                        title="Cantidad"
                                        className="h-6 w-12 text-center p-0 text-[11px]"
                                        value={det.cantidad}
                                        onChange={(e) => {
                                          const qty = parseInt(e.target.value) || 1;
                                          const updatedDetalles = [...intent.data.detalles];
                                          updatedDetalles[idx] = {
                                            ...det,
                                            cantidad: qty,
                                            subtotal: qty * Number(det.precio_unitario || 0)
                                          };
                                          const newTotal = updatedDetalles.reduce((acc, curr) => acc + curr.subtotal, 0);
                                          setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                            ...m,
                                            intent: { ...m.intent, data: { ...m.intent.data, detalles: updatedDetalles, total_bs: newTotal } }
                                          } : m));
                                        }}
                                      />
                                      <span className="text-[10px] text-muted-foreground">×</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        title="Precio unitario Bs"
                                        placeholder="Precio"
                                        className={cn(
                                          "h-6 w-16 text-center p-0 text-[11px]",
                                          (!det.precio_unitario || Number(det.precio_unitario) <= 0) && "border-amber-400 ring-1 ring-amber-300"
                                        )}
                                        value={det.precio_unitario === 0 ? "" : det.precio_unitario}
                                        onChange={(e) => {
                                          const prec = parseFloat(e.target.value) || 0;
                                          const updatedDetalles = [...intent.data.detalles];
                                          updatedDetalles[idx] = {
                                            ...det,
                                            precio_unitario: prec,
                                            subtotal: Number(det.cantidad) * prec,
                                            precioFuente: prec > 0 ? "voz" : "pendiente",
                                          };
                                          const newTotal = updatedDetalles.reduce((acc, curr) => acc + curr.subtotal, 0);
                                          setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                            ...m,
                                            intent: { ...m.intent, data: { ...m.intent.data, detalles: updatedDetalles, total_bs: newTotal } }
                                          } : m));
                                        }}
                                      />
                                      <span className="font-mono text-[10px] min-w-[48px] text-right ml-auto">
                                        Bs {Number(det.subtotal || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-2 font-semibold">
                              <span>Total Neto:</span>
                              <span className="text-sm font-mono text-indigo-700 dark:text-indigo-400">
                                Bs {intent.data.total_bs.toFixed(2)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => {
                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, intent: undefined, text: "Acción cancelada." } : m));
                              }}>
                                Cancelar
                              </Button>
                              <Button size="sm" className="h-8 text-[11px] gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleConfirmFactura(msg.id, intent.data)}>
                                <CheckCircle className="h-3 w-3" /> Registrar Venta
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* 📥 CASO MOVIMIENTO */}
                        {intent.type === "movimiento" && (
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-400 border-b pb-2">
                              <ArrowLeftRight className="h-4 w-4 text-emerald-600" /> Registrar Movimiento Almacén
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                                <Select 
                                  value={intent.data.tipo} 
                                  onValueChange={(val) => {
                                    setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                      ...m,
                                      intent: { ...m.intent, data: { ...m.intent.data, tipo: val } }
                                    } : m));
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="salida">Salida</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Categoría</Label>
                                <Input 
                                  className="h-7 text-xs"
                                  value={intent.data.categoria}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                      ...m,
                                      intent: { ...m.intent, data: { ...m.intent.data, categoria: val } }
                                    } : m));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Producto</Label>
                              <Input 
                                className="h-7 text-xs"
                                value={intent.data.producto}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                    ...m,
                                    intent: { ...m.intent, data: { ...m.intent.data, producto: val } }
                                  } : m));
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Cantidad</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  className="h-7 text-xs"
                                  value={intent.data.cantidad}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                      ...m,
                                      intent: { ...m.intent, data: { ...m.intent.data, cantidad: val } }
                                    } : m));
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Precio unitario (Bs)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  placeholder="Ej: 50"
                                  className={cn(
                                    "h-7 text-xs",
                                    (!intent.data.precio || Number(intent.data.precio) <= 0) && !intent.data.existe && "border-amber-400 ring-1 ring-amber-300"
                                  )}
                                  value={intent.data.precio === 0 || intent.data.precio === "" ? "" : intent.data.precio}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                    setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                      ...m,
                                      intent: {
                                        ...m.intent,
                                        data: {
                                          ...m.intent.data,
                                          precio: Number.isFinite(val) ? val : 0,
                                          precioFuente: (Number.isFinite(val) && val > 0) ? "voz" : "pendiente",
                                        }
                                      }
                                    } : m));
                                  }}
                                />
                              </div>
                            </div>
                            {intent.data.precio > 0 && intent.data.cantidad > 0 && (
                              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800 font-medium">
                                Total: Bs {(Number(intent.data.cantidad) * Number(intent.data.precio)).toFixed(2)}
                                {intent.data.precioFuente === "voz" ? " · detectado por voz" : intent.data.precioFuente === "catalogo" ? " · del catálogo" : ""}
                              </div>
                            )}
                            {(!intent.data.precio || Number(intent.data.precio) <= 0) && !intent.data.existe && (
                              <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                Producto nuevo: escribe el precio real. No se inventa un valor por defecto.
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => {
                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, intent: undefined, text: "Acción cancelada." } : m));
                              }}>
                                Cancelar
                              </Button>
                              <Button size="sm" className="h-8 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleConfirmMovimiento(msg.id, intent.data)}>
                                <CheckCircle className="h-3 w-3" /> Registrar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* 🛒 CASO ORDEN DE COMPRA */}
                        {intent.type === "orden" && (
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-400 border-b pb-2">
                              <ShoppingCart className="h-4 w-4 text-amber-600" /> Crear Orden de Compra
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Proveedor</Label>
                              <Input
                                className="h-7 text-xs"
                                value={intent.data.proveedor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                    ...m,
                                    intent: { ...m.intent, data: { ...m.intent.data, proveedor: val } }
                                  } : m));
                                }}
                              />
                            </div>

                            {/* Líneas de productos */}
                            {Array.isArray(intent.data.lineas) && intent.data.lineas.length > 0 && (
                              <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground">Productos detectados</Label>
                                <div className="max-h-40 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-muted/10">
                                  {intent.data.lineas.map((l: any, idx: number) => (
                                    <div key={idx} className="rounded border border-amber-100 bg-amber-50/40 p-1.5 space-y-1">
                                      <div className="font-medium truncate text-[11px]">{l.producto}</div>
                                      <div className="grid grid-cols-3 gap-1">
                                        <div>
                                          <div className="text-[9px] text-muted-foreground">Paquetes</div>
                                          <Input
                                            type="number" min="1"
                                            className="h-5 text-[10px] text-center p-0.5"
                                            value={l.paquetes}
                                            onChange={(e) => {
                                              const paq = parseInt(e.target.value) || 1;
                                              const newLineas = [...intent.data.lineas];
                                              newLineas[idx] = { ...l, paquetes: paq };
                                              const newTotal = newLineas.reduce((a: number, x: any) => a + x.paquetes * x.precioPorPaquete, 0);
                                              const newItems = newLineas.reduce((a: number, x: any) => a + x.paquetes * x.unidadesPorPaquete, 0);
                                              setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                                ...m,
                                                intent: { ...m.intent, data: { ...m.intent.data, lineas: newLineas, total: newTotal, items: newItems } }
                                              } : m));
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <div className="text-[9px] text-muted-foreground">U/Paq</div>
                                          <Input
                                            type="number" min="1"
                                            className="h-5 text-[10px] text-center p-0.5"
                                            value={l.unidadesPorPaquete}
                                            onChange={(e) => {
                                              const uPaq = parseInt(e.target.value) || 1;
                                              const newLineas = [...intent.data.lineas];
                                              newLineas[idx] = { ...l, unidadesPorPaquete: uPaq };
                                              const newItems = newLineas.reduce((a: number, x: any) => a + x.paquetes * x.unidadesPorPaquete, 0);
                                              setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                                ...m,
                                                intent: { ...m.intent, data: { ...m.intent.data, lineas: newLineas, items: newItems } }
                                              } : m));
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <div className="text-[9px] text-muted-foreground">Precio/Paq Bs</div>
                                          <Input
                                            type="number" min="0" step="0.01"
                                            className="h-5 text-[10px] text-center p-0.5"
                                            value={l.precioPorPaquete}
                                            onChange={(e) => {
                                              const prec = parseFloat(e.target.value) || 0;
                                              const newLineas = [...intent.data.lineas];
                                              newLineas[idx] = { ...l, precioPorPaquete: prec };
                                              const newTotal = newLineas.reduce((a: number, x: any) => a + x.paquetes * x.precioPorPaquete, 0);
                                              setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                                ...m,
                                                intent: { ...m.intent, data: { ...m.intent.data, lineas: newLineas, total: newTotal } }
                                              } : m));
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="text-right text-[10px] font-mono text-amber-700 font-semibold">
                                        {l.paquetes}×{l.unidadesPorPaquete}u = {l.paquetes * l.unidadesPorPaquete}u · Bs {(l.paquetes * l.precioPorPaquete).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t pt-2 font-semibold">
                              <div className="text-[10px] text-muted-foreground">
                                {intent.data.items} unidades totales
                              </div>
                              <span className="text-sm font-mono text-amber-700 dark:text-amber-400">
                                Total: Bs {Number(intent.data.total).toFixed(2)}
                              </span>
                            </div>

                            {/* Campos de respaldo si no hay lineas */}
                            {(!intent.data.lineas || intent.data.lineas.length === 0) && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">Cant. Ítems</Label>
                                  <Input
                                    type="number"
                                    className="h-7 text-xs"
                                    value={intent.data.items}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                        ...m,
                                        intent: { ...m.intent, data: { ...m.intent.data, items: val } }
                                      } : m));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">Total (Bs)</Label>
                                  <Input
                                    type="number" step="0.01"
                                    className="h-7 text-xs"
                                    value={intent.data.total}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                        ...m,
                                        intent: { ...m.intent, data: { ...m.intent.data, total: val } }
                                      } : m));
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => {
                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, intent: undefined, text: "Acción cancelada." } : m));
                              }}>
                                Cancelar
                              </Button>
                              <Button size="sm" className="h-8 text-[11px] gap-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleConfirmOrden(msg.id, intent.data)}>
                                <CheckCircle className="h-3 w-3" /> Crear Orden
                              </Button>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                    {/* BOTON DE IMPRIMIR FACTURA (SI SE CONFIRMÓ Y ES DE TIPO FACTURA) */}
                    {isAssistant && intent && intent.confirmed && intent.type === "factura" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 h-8 text-xs font-medium border border-indigo-200 mt-1"
                        onClick={() => {
                          const numEstimado = "F-" + Math.floor(Math.random() * 100 + 100);
                          imprimirFactura({
                            numero: numEstimado,
                            cliente: intent.data.cliente,
                            fecha: new Date().toISOString().split("T")[0],
                            total_bs: intent.data.total_bs,
                            estado: "Pagada",
                            detalles: intent.data.detalles
                          });
                        }}
                      >
                        <Printer className="h-3.5 w-3.5" /> Descargar Factura (PDF)
                      </Button>
                    )}

                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex gap-2 max-w-[80%] items-center text-xs text-muted-foreground italic">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Analizando tu frase...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-popover rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleVoice}
                className={cn(
                  "h-9 w-9 rounded-full shrink-0 transition-colors",
                  isListening 
                    ? "bg-rose-500 text-white hover:bg-rose-600 hover:text-white animate-pulse" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={isListening ? "Detener grabación" : "Dictar por voz"}
              >
                {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </Button>
              
              <Input
                placeholder="Escribe o dicta tu comando aquí..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 h-9 text-xs rounded-full"
                disabled={isProcessing}
              />
              
              <Button 
                type="submit" 
                size="icon" 
                className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0 text-white"
                disabled={!inputValue.trim() || isProcessing}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
