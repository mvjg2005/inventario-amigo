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

export function AiChatBot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "¡Hola! Soy Stocky 🤖, tu asistente de inventario inteligente.\n\nPuedo registrar compras, ventas, facturas o crear órdenes de proveedores. ¿Qué deseas hacer hoy?\n\n*Ejemplos:*\n• *\"Vendí 6 huevos y una mayonesa al cliente Juan Perez\"*\n• *\"Compré Coca Cola que está ingresando a un precio de 8 Bs\"*\n• *\"Crear orden al proveedor PIL de 15 items por un total de 400 Bs\"*",
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
    
    // 1. INTENTO FACTURA
    const isFactura = /factura|cliente|compr[oó]|vendi|vend[íi]|venta/i.test(cleanText);
    if (isFactura) {
      let cliente = "Cliente General";
      const clienteMatch = cleanText.match(/(?:cliente|para)\s+([a-z\s]+?)(?:\s+me\s+compro|\s+compro|\s+compró|\s+compr|:|$|\d+)/i);
      if (clienteMatch && clienteMatch[1]) {
        cliente = clienteMatch[1].trim();
        cliente = cliente.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      
      const partes = cleanText.split(/,|\by\b|\be\b|\bcon\b/);
      const detalles: any[] = [];
      let totalBs = 0;
      
      partes.forEach(part => {
        const p = part.trim();
        if (!p) return;
        
        let cantidad = 1;
        const numMatch = p.match(/\d+/);
        if (numMatch) {
          cantidad = parseInt(numMatch[0]);
        } else if (/\b(un|una|uno)\b/i.test(p)) {
          cantidad = 1;
        } else if (/\b(dos)\b/i.test(p)) {
          cantidad = 2;
        } else if (/\b(tres)\b/i.test(p)) {
          cantidad = 3;
        } else if (/\b(cuatro)\b/i.test(p)) {
          cantidad = 4;
        } else if (/\b(cinco)\b/i.test(p)) {
          cantidad = 5;
        } else if (/\b(seis)\b/i.test(p)) {
          cantidad = 6;
        } else if (/\b(diez)\b/i.test(p)) {
          cantidad = 10;
        }
        
        let prodNombre = p
          .replace(/^\d+/g, "")
          .replace(/\b(un|una|uno|unos|unas|dos|tres|cuatro|cinco|seis|diez|docena|docenas|de|del|el|la|los|las)\b/gi, "")
          .replace(/\b(bolivianos|bs|boliviano|pesos|dolares|usd|compro|compró|cliente|factura|vendi|vendió)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        
        if (prodNombre.length < 2) return;
        prodNombre = prodNombre.charAt(0).toUpperCase() + prodNombre.slice(1);
        
        // Buscar coincidencia en productos existentes
        const matches = productosExistentes.filter(prod => 
          prod.nombre.toLowerCase().includes(prodNombre.toLowerCase()) || 
          prodNombre.toLowerCase().includes(prod.nombre.toLowerCase())
        );
        
        let matchedProd = matches.length > 0 ? matches[0] : null;
        const exactMatch = matches.find(prod => prod.nombre.toLowerCase() === prodNombre.toLowerCase());
        if (exactMatch) matchedProd = exactMatch;
        
        const precioUnitario = matchedProd ? Number(matchedProd.precio) : 5.00;
        const sku = matchedProd ? matchedProd.sku : prodNombre.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) + "-" + Math.floor(Math.random() * 900 + 100);
        const subtotal = cantidad * precioUnitario;
        totalBs += subtotal;
        
        detalles.push({
          producto: matchedProd ? matchedProd.nombre : prodNombre,
          sku,
          cantidad,
          precio_unitario: precioUnitario,
          subtotal,
          existe: !!matchedProd,
          originalId: matchedProd ? matchedProd.id : null,
          currentStock: matchedProd ? matchedProd.stock : 0
        });
      });
      
      if (detalles.length === 0) return { type: "unknown" };
      
      return {
        type: "factura",
        data: {
          cliente,
          total_bs: totalBs,
          estado: "Pagada",
          detalles
        }
      };
    }

    // 2. INTENTO ORDEN
    const isOrden = /orden|proveedor|pedido|pedi|pedí|de don|del proveedor|comprand|comprando/i.test(cleanText);
    if (isOrden) {
      // Extraer proveedor - puede ser "de don Juan", "al proveedor PIL", "de mi proveedor X"
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

      // Parsear líneas de producto con el patrón:
      // "N paquetes de PRODUCTO de M unidades a P bs"
      // "N paquetes de PRODUCTO (M unidades) a P bs"
      // "N PRODUCTO a P bs"
      const lineasOrden: any[] = [];
      // Dividir por comas, "luego", "también", "y además"
      const segmentos = cleanText.split(/,|\bluego\b|\btambién\b|\bademás\b|\by además\b/i);

      segmentos.forEach(seg => {
        const s = seg.trim();
        // Patrón: N paquetes de PROD de M unidades a P bs
        const pat1 = /(\d+)\s*paquetes?\s+de\s+([a-záéíóúñ\s]+?)\s+de\s+(\d+)\s*unidades?\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;
        // Patrón: N paquetes de PROD (M unidades) a P bs
        const pat2 = /(\d+)\s*paquetes?\s+de\s+([a-záéíóúñ\s]+?)\s*\(?\s*(\d+)\s*unidades?\s*\)?\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;
        // Patrón: N paquetes de PROD a P bs (sin unidades)
        const pat3 = /(\d+)\s*paquetes?\s+de\s+([a-záéíóúñ\s]+?)\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;
        // Patrón: N PROD a P bs
        const pat4 = /(\d+)\s+(?:de\s+)?([a-záéíóúñ][a-záéíóúñ\s]{2,}?)\s+a\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?)?/i;

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
        m = s.match(pat4);
        if (m) {
          lineasOrden.push({
            producto: m[2].trim().split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            paquetes: parseInt(m[1]),
            unidadesPorPaquete: 1,
            precioPorPaquete: parseFloat(m[3].replace(",", ".")),
          });
        }
      });

      // Si no detectó líneas, crear una genérica
      if (lineasOrden.length === 0) {
        let totalFallback = 0;
        const totalMatch = cleanText.match(/(?:total|valor|por|de)\s+(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?|pesos)?/i) ||
          cleanText.match(/(\d+(?:[.,]\d+)?)\s*(?:bs|bolivianos?|boliviano)/i);
        if (totalMatch?.[1]) totalFallback = parseFloat(totalMatch[1].replace(",", "."));
        lineasOrden.push({ producto: "Producto General", paquetes: 1, unidadesPorPaquete: 1, precioPorPaquete: totalFallback });
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

    // 3. INTENTO MOVIMIENTO
    const esEntrada = /compr[eé]|entr[oó]|recibi|ingres[oó]|lleg[oó]/.test(cleanText);
    const esSalida = /vend[íi]|vend[ée]|sali[oó]|despach[aó]|retir[oó]|gasto|salida/.test(cleanText);
    
    if (esEntrada || esSalida) {
      const tipo: "entrada" | "salida" = esEntrada ? "entrada" : "salida";
      
      const numeros = cleanText.match(/\d+(?:[.,]\d+)?/g) ?? [];
      const cantidad = numeros.length > 0 ? parseInt(numeros[0] ?? "1") : 1;
      const precio = numeros.length > 1 ? parseFloat((numeros[numeros.length - 1] ?? "0").replace(",", ".")) : 0;
      
      let producto = cleanText
        .replace(/^(vend[íi]|vend[ée]|compr[eé]|entr[oó]|sali[oó]|recib[íi]|despacha[oó]|ingreso|ingresó|salida|entrada|gasto)\s+/i, "")
        .replace(/\d+(?:[.,]\d+)?\s*(bolivianos?|bs\.?|pesos?|dólares?|usd)?\s*$/i, "")
        .replace(/\s+(a|por|precio|cada|al)\s+.*$/i, "")
        .replace(/^\d+(?:[.,]\d+)?\s*(unidades?|kilos?|kg|litros?|cajas?|bolsas?|paquetes?|docenas?)?\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
        
      if (producto.length >= 2) {
        producto = producto.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        const matches = productosExistentes.filter(prod => prod.nombre.toLowerCase() === producto.toLowerCase());
        const sku = matches.length > 0 ? matches[0].sku : producto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) + "-" + Math.floor(Math.random() * 900 + 100);
        const categoria = matches.length > 0 ? matches[0].categoria : detectarCategoria(producto);
        
        return {
          type: "movimiento",
          data: {
            producto,
            sku,
            tipo,
            cantidad,
            precio,
            categoria
          }
        };
      }
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
      
      let assistantMsg: Message;
      
      if (intent.type === "factura") {
        assistantMsg = {
          id: "reply-" + Date.now(),
          sender: "assistant",
          text: `He estructurado la siguiente factura basándome en el inventario actual. ¿Deseas guardarla y generar el comprobante?`,
          timestamp: new Date(),
          intent: intent as any
        };
      } else if (intent.type === "movimiento") {
        assistantMsg = {
          id: "reply-" + Date.now(),
          sender: "assistant",
          text: `He estructurado el siguiente movimiento de inventario. ¿Confirmas el registro?`,
          timestamp: new Date(),
          intent: intent as any
        };
      } else if (intent.type === "orden") {
        assistantMsg = {
          id: "reply-" + Date.now(),
          sender: "assistant",
          text: `He estructurado la siguiente orden de compra. ¿Confirmas el registro?`,
          timestamp: new Date(),
          intent: intent as any
        };
      } else {
        assistantMsg = {
          id: "reply-" + Date.now(),
          sender: "assistant",
          text: "No estoy seguro de haber entendido. ¿Podrías intentar expresarlo de otra forma? Recuerda que puedo:\n- Generar facturas (ej. *'vendi 3 panes'*)\n- Registrar movimientos (ej. *'compré 10 leches a 5 bs'*)\n- Crear órdenes de compra (ej. *'orden de compra a PIL'*).",
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, assistantMsg]);
      setIsProcessing(false);
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
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    setIsListening(true);
    toast.info("Escuchando tu voz...");

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputValue(resultText);
      setIsListening(false);
      handleSend(resultText);
    };

    rec.onend = () => {
      setIsListening(false);
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
    setIsProcessing(true);
    try {
      // 1. Guardar la factura
      const factRes = await createFacturaFn({
        data: {
          cliente: data.cliente,
          total_bs: data.total_bs,
          estado: data.estado,
          detalles: data.detalles
        }
      } as any);

      // 2. Decrementar el stock de los productos que sí existen en la base de datos
      // y registrar sus movimientos correspondientes
      for (const item of data.detalles) {
        // Registrar el movimiento de salida
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
              estado
            }
          } as any);
        }
      }

      // Obtener el número correlativo generado (estimado o volvemos a cargar facturas)
      // Como createFacturaFn genera secuenciales, sólo indicamos éxito
      toast.success("Factura generada y stock actualizado.");

      // Marcar mensaje como confirmado
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.intent) {
          return {
            ...m,
            text: `¡Factura generada correctamente! Factura para **${data.cliente}** por un total de **Bs ${data.total_bs.toFixed(2)}**.`,
            intent: { ...m.intent, confirmed: true }
          };
        }
        return m;
      }));

      // Recargar base de datos local y router
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
    setIsProcessing(true);
    try {
      // 1. Crear el movimiento
      await createMovimientoFn({
        data: {
          producto: data.producto,
          sku: data.sku,
          tipo: data.tipo,
          cantidad: data.cantidad
        }
      } as any);

      // 2. Intentar actualizar o crear el producto en inventario
      const matches = productos.filter(
        p => p.sku === data.sku || p.nombre.toLowerCase() === data.producto.toLowerCase()
      );
      const existe = matches.length > 0;

      if (existe) {
        const prod = matches[0];
        const nuevoStock = data.tipo === "entrada" 
          ? prod.stock + data.cantidad 
          : Math.max(0, prod.stock - data.cantidad);
        const estado = nuevoStock === 0 ? "sin" : nuevoStock <= 20 ? "bajo" : "normal";

        await updateProductFn({
          data: {
            id: prod.id,
            stock: nuevoStock,
            estado
          }
        } as any);
      } else {
        // Crear producto nuevo
        const precioUnitario = data.precio > 0 ? data.precio : 10.00;
        const stockInicial = data.tipo === "entrada" ? data.cantidad : 0;
        const estado = stockInicial === 0 ? "sin" : stockInicial <= 20 ? "bajo" : "normal";

        await createProductFn({
          data: {
            sku: data.sku,
            nombre: data.producto,
            categoria: data.categoria,
            precio: precioUnitario,
            stock: stockInicial,
            estado
          }
        } as any);
      }

      toast.success("Movimiento registrado y stock actualizado.");

      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.intent) {
          return {
            ...m,
            text: `¡Movimiento registrado con éxito! Se cargó una **${data.tipo === "entrada" ? "Entrada" : "Salida"}** de **${data.cantidad} unidades** para el producto **${data.producto}**.`,
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
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-rose-500 hover:bg-rose-600 rotate-90 scale-90" : "bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
        )}
        title="Asistente de IA Stocky"
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-white animate-pulse" />}
      </Button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[550px] w-[380px] flex-col rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold leading-none">Stocky AI</h3>
              <span className="text-[10px] text-indigo-100 flex items-center gap-1 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Activo • Dictado de voz disponible
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
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
                              <Label className="text-[10px] text-muted-foreground">Productos Detectados</Label>
                              <div className="max-h-28 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-muted/10">
                                {intent.data.detalles.map((det: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center py-1 border-b last:border-0">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <span className="font-medium truncate block">{det.producto}</span>
                                      <span className="text-[9px] text-muted-foreground block">
                                        Stock: {det.currentStock} {det.existe ? "" : " (No registrado)"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Input 
                                        type="number"
                                        className="h-6 w-10 text-center p-0"
                                        value={det.cantidad}
                                        onChange={(e) => {
                                          const qty = parseInt(e.target.value) || 1;
                                          const updatedDetalles = [...intent.data.detalles];
                                          updatedDetalles[idx] = { 
                                            ...det, 
                                            cantidad: qty,
                                            subtotal: qty * det.precio_unitario
                                          };
                                          const newTotal = updatedDetalles.reduce((acc, curr) => acc + curr.subtotal, 0);
                                          setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                            ...m,
                                            intent: { ...m.intent, data: { ...m.intent.data, detalles: updatedDetalles, total_bs: newTotal } }
                                          } : m));
                                        }}
                                      />
                                      <span className="font-mono text-[10px] min-w-[45px] text-right">
                                        Bs {det.subtotal.toFixed(2)}
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
                                <Label className="text-[10px] text-muted-foreground">Precio Ref (Bs)</Label>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  className="h-7 text-xs"
                                  value={intent.data.precio}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setMessages(prev => prev.map(m => m.id === msg.id && m.intent ? {
                                      ...m,
                                      intent: { ...m.intent, data: { ...m.intent.data, precio: val } }
                                    } : m));
                                  }}
                                />
                              </div>
                            </div>

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
