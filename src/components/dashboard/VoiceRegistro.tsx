import { useState, useRef } from "react";
import { Mic, MicOff, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generarSku, parseMovimientoVoice } from "@/lib/voiceParse";

const CATEGORIAS: Record<string, string[]> = {
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
  for (const [cat, palabras] of Object.entries(CATEGORIAS)) {
    if (palabras.some(p => lower.includes(p))) return cat;
  }
  return "General";
}

interface ParsedVoice {
  producto: string;
  cantidad: number;
  precio: number;
  tipo: "entrada" | "salida";
  categoria: string;
  sku: string;
  confianza: number;
  precioDetectado: boolean;
}

function parsearTexto(texto: string): ParsedVoice | null {
  const mov = parseMovimientoVoice(texto);
  if (!mov) return null;

  let confianza = 40;
  if (mov.cantidad > 1) confianza += 15;
  if (mov.precioDetectado && mov.precio > 0) confianza += 30;
  if (mov.producto.length >= 3) confianza += 10;
  if (mov.tipo) confianza += 5;

  return {
    producto: mov.producto,
    cantidad: mov.cantidad,
    precio: mov.precio,
    tipo: mov.tipo,
    categoria: detectarCategoria(mov.producto),
    sku: generarSku(mov.producto),
    confianza: Math.min(100, confianza),
    precioDetectado: mov.precioDetectado,
  };
}

interface VoiceRegistroProps {
  onConfirm: (data: {
    producto: string; sku: string; tipo: "entrada" | "salida";
    cantidad: number; precio: number; categoria: string;
  }) => Promise<void>;
}

type Estado = "idle" | "escuchando" | "procesando" | "confirmando" | "guardando";

export function VoiceRegistro({ onConfirm }: VoiceRegistroProps) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [transcripcion, setTranscripcion] = useState("");
  const [parsed, setParsed] = useState<ParsedVoice | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ producto: "", sku: "", tipo: "salida" as "entrada" | "salida", cantidad: "", precio: "", categoria: "General" });

  // ⚡ Ref para evitar stale closure — siempre tendrá el valor actual
  const transcripcionRef = useRef("");
  const recognitionRef = useRef<any>(null);

  const procesarTranscripcion = (texto: string) => {
    setEstado("procesando");
    setTimeout(() => {
      if (!texto.trim()) {
        toast.warning("No se detectó ninguna frase. Habla más cerca del micrófono.");
        setEstado("idle");
        return;
      }
      const resultado = parsearTexto(texto);
      if (!resultado) {
        toast.error("No pude identificar el producto. Intenta: \"Vendí 10 panes a 4 bolivianos\"");
        setEstado("idle");
        return;
      }
      setParsed(resultado);
      setForm({
        producto: resultado.producto,
        sku: resultado.sku,
        tipo: resultado.tipo,
        cantidad: resultado.cantidad.toString(),
        precio: resultado.precio > 0 ? resultado.precio.toString() : "",
        categoria: resultado.categoria,
      });
      setEstado("confirmando");
    }, 500);
  };

  const iniciarEscucha = () => {
    if (window.location.protocol === "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      toast.error("El micrófono requiere una conexión segura (HTTPS) o acceder vía 'localhost' en esta PC.");
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error("Tu navegador no soporta voz. Te recomendamos usar Google Chrome o Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "es-BO";
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    transcripcionRef.current = "";

    // Flag para no procesar doble (onresult final + onend)
    let yaProcesoFinal = false;

    setEstado("escuchando");
    setTranscripcion("");
    setIsOpen(true);

    recognition.onresult = (event: any) => {
      let interimText = "";
      let finalText = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Mostrar interim en UI para feedback visual
      const textoMostrar = finalText || interimText;
      transcripcionRef.current = textoMostrar;
      setTranscripcion(textoMostrar);

      // ✅ Procesar inmediatamente cuando hay un resultado FINAL
      if (finalText && !yaProcesoFinal) {
        yaProcesoFinal = true;
        recognition.stop();
        procesarTranscripcion(finalText);
      }
    };

    recognition.onend = () => {
      // Fallback: si onresult nunca dio un resultado final, usar lo que tengamos
      if (!yaProcesoFinal) {
        const textoGuardado = transcripcionRef.current;
        if (textoGuardado.trim()) {
          yaProcesoFinal = true;
          procesarTranscripcion(textoGuardado);
        } else {
          // Realmente no se captó nada — dar opción manual
          setEstado("idle");
          toast.warning("No capté audio. ¿Diste permiso al micrófono? Intenta pulsar el botón y habla inmediatamente.");
        }
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") {
        // no-speech no siempre es un error — a veces se emite antes del resultado
        // Solo mostrar si no tenemos texto
        if (!transcripcionRef.current.trim() && !yaProcesoFinal) {
          toast.warning("No detecté tu voz. Habla claro y directo al micrófono.");
          setEstado("idle");
        }
      } else if (e.error === "not-allowed") {
        toast.error("Permiso de micrófono denegado. Haz clic en el candado de la barra del navegador y permite el micrófono.");
        setEstado("idle");
      } else if (e.error === "network") {
        // Error de red — procesar lo que tenemos si hay algo
        if (transcripcionRef.current.trim() && !yaProcesoFinal) {
          yaProcesoFinal = true;
          procesarTranscripcion(transcripcionRef.current);
        } else {
          toast.error("Error de conexión. El reconocimiento de voz requiere internet.");
          setEstado("idle");
        }
      } else {
        toast.error(`Error de micrófono: ${e.error}`);
        setEstado("idle");
      }
    };

    try {
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setEstado("idle");
      toast.error(`No se pudo iniciar el micrófono: ${err.message || err}`);
    }
  };

  const detenerEscucha = () => recognitionRef.current?.stop();

  const reiniciar = () => {
    setEstado("idle");
    setTranscripcion("");
    transcripcionRef.current = "";
    setParsed(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) { recognitionRef.current?.stop(); reiniciar(); }
    setIsOpen(open);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantidad = parseInt(form.cantidad);
    const precio = parseFloat(form.precio);
    if (isNaN(cantidad) || cantidad <= 0) { toast.error("La cantidad debe ser mayor a 0"); return; }
    if (isNaN(precio) || precio <= 0) {
      toast.error("Indica el precio unitario real (Bs). No se asigna un valor por defecto.");
      return;
    }
    setEstado("guardando");
    try {
      await onConfirm({
        producto: form.producto, sku: form.sku, tipo: form.tipo,
        cantidad, precio, categoria: form.categoria,
      });
      toast.success(`✅ ${form.tipo === "salida" ? "Venta" : "Entrada"} de ${cantidad} ${form.producto} a Bs ${precio.toFixed(2)}`);
      setEstado("idle");
      setIsOpen(false);
      reiniciar();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
      setEstado("confirmando");
    }
  };

  // Estado para comando escrito manualmente
  const [comandoEscrito, setComandoEscrito] = useState("");

  const handleProcesarEscrito = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comandoEscrito.trim()) return;
    setTranscripcion(comandoEscrito);
    procesarTranscripcion(comandoEscrito);
    setComandoEscrito("");
  };

  return (
    <>
      {/* Botón flotante */}
      <Button
        onClick={estado === "escuchando" ? detenerEscucha : () => { setIsOpen(true); iniciarEscucha(); }}
        size="lg"
        className={cn(
          "safe-bottom fixed right-3 z-50 h-12 w-12 rounded-full shadow-xl transition-all duration-300 sm:right-6 sm:h-14 sm:w-14",
          estado === "escuchando" ? "bg-rose-500 hover:bg-rose-600 animate-pulse scale-110" : "bg-primary hover:bg-primary/90"
        )}
        title="Registrar venta por voz o texto"
      >
        {estado === "escuchando" ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" /> Asistente de Registro Rápido (IA)
            </DialogTitle>
          </DialogHeader>

          {/* Escuchando / Procesando */}
          {(estado === "escuchando" || estado === "procesando") && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full bg-primary/10",
                estado === "escuchando" && "ring-4 ring-primary/30 animate-pulse"
              )}>
                {estado === "escuchando"
                  ? <Mic className="h-10 w-10 text-primary" />
                  : <Loader2 className="h-10 w-10 text-primary animate-spin" />}
              </div>
              <div className="text-center">
                <p className="font-semibold">{estado === "escuchando" ? "Escuchando..." : "Analizando..."}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {estado === "escuchando" ? 'Di: "Vendí 10 panes a 4 bolivianos"' : "Procesando con IA..."}
                </p>
              </div>
              {transcripcion && (
                <div className="w-full rounded-lg border bg-muted/50 p-3 text-sm text-center italic">"{transcripcion}"</div>
              )}
              {estado === "escuchando" && (
                <Button variant="outline" onClick={detenerEscucha} className="gap-2">
                  <MicOff className="h-4 w-4" /> Terminar de hablar
                </Button>
              )}
            </div>
          )}

          {/* Idle: instrucciones y entrada manual */}
          {estado === "idle" && (
            <div className="flex flex-col gap-4 py-2">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                <p className="font-medium mb-2">💡 Ejemplos de lo que puedes decir:</p>
                {[
                  '"Vendí 10 panes a 4 bolivianos"',
                  '"Salida de 5 kilos de arroz"',
                  '"Compré 20 litros de aceite a 15 bs"',
                  '"Vendí 3 quesos a 25 bolivianos"',
                ].map(ej => <p key={ej} className="text-muted-foreground">• {ej}</p>)}
              </div>
              
              <Button onClick={iniciarEscucha} className="gap-2 w-full">
                <Mic className="h-4 w-4" /> Comenzar a hablar
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-muted" />
                <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">O escribe la frase aquí</span>
                <div className="flex-grow border-t border-muted" />
              </div>

              <form onSubmit={handleProcesarEscrito} className="flex gap-2">
                <Input
                  value={comandoEscrito}
                  onChange={(e) => setComandoEscrito(e.target.value)}
                  placeholder="Ej: vendi 10 panes a 4 bs"
                  className="flex-1"
                />
                <Button type="submit" variant="secondary">Procesar</Button>
              </form>
            </div>
          )}

          {/* Confirmando / Guardando */}
          {(estado === "confirmando" || estado === "guardando") && parsed && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Escuché: </span>
                <span className="italic">"{transcripcion}"</span>
              </div>
              <Badge variant="outline" className={cn(
                "text-xs",
                parsed.confianza >= 80 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : parsed.confianza >= 60 ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              )}>
                {parsed.confianza >= 80 ? "✓ Alta confianza" : "⚠ Revisa los datos"}
              </Badge>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salida">Venta / Salida</SelectItem>
                      <SelectItem value="entrada">Compra / Entrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Categoría (IA)</Label>
                  <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CATEGORIAS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Producto detectado</Label>
                <Input value={form.producto} onChange={e => setForm({ ...form, producto: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>SKU</Label>
                <div className="flex gap-2">
                  <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                  <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, sku: generarSku(form.producto) })}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Cantidad</Label>
                  <Input type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Precio unitario (Bs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio}
                    onChange={e => setForm({ ...form, precio: e.target.value })}
                    placeholder="Ej: 50"
                    required
                    className={cn(!form.precio || parseFloat(form.precio) <= 0 ? "border-amber-400" : "")}
                  />
                </div>
              </div>
              {parsed && !parsed.precioDetectado && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                  No se detectó precio en la frase. Escríbelo manualmente (ej. 50). No se usa un valor inventado.
                </p>
              )}
              {form.cantidad && form.precio && parseFloat(form.precio) > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 font-medium">
                  💰 Total: Bs {(parseInt(form.cantidad) * parseFloat(form.precio)).toFixed(2)}
                  {parsed?.precioDetectado ? " · precio por voz" : ""}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 gap-1" onClick={reiniciar}>
                  <RefreshCw className="h-4 w-4" /> Volver a grabar
                </Button>
                <Button type="submit" className="flex-1 gap-1" disabled={estado === "guardando"}>
                  {estado === "guardando"
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                    : <><CheckCircle className="h-4 w-4" /> Confirmar</>}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
