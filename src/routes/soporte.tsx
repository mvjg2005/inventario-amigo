import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, Send, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/soporte")({
  head: () => ({ meta: [{ title: "Soporte Técnico — Inventario Amigo" }] }),
  component: SoportePage,
});

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "msg-0",
  role: "bot",
  content: "¡Hola! Soy el asistente virtual de StockPyme. ¿En qué te puedo ayudar hoy? Puedes preguntarme sobre productos, exportaciones, configuración o reportes."
};

function getBotResponse(input: string): string {
  const text = input.toLowerCase();
  
  if (text.includes("producto") || text.includes("agregar") || text.includes("crear")) {
    return "Para gestionar productos, dirígete a la sección 'Productos' en el menú lateral. Allí podrás usar el botón 'Nuevo producto' para añadir ítems, o usar los íconos de lápiz y papelera para editar o eliminar los existentes.";
  }
  if (text.includes("factura") || text.includes("dolar") || text.includes("boliviano")) {
    return "En la sección de 'Facturas' ahora puedes crear nuevas facturas. Además, incluimos un botón en la parte superior para cambiar la vista de toda la tabla entre Bolivianos (Bs) y Dólares (USD) usando la tasa de 6.96.";
  }
  if (text.includes("pdf") || text.includes("reporte") || text.includes("descargar")) {
    return "Los reportes se pueden generar en la sección 'Reportes'. Al hacer clic en PDF, el sistema preparará el documento y abrirá el diálogo de impresión para que puedas guardar el reporte como PDF.";
  }
  if (text.includes("hola") || text.includes("saludo")) {
    return "¡Hola! Qué gusto saludarte. ¿Tienes alguna duda sobre cómo usar el sistema?";
  }
  
  return "Gracias por tu consulta. Como soy un prototipo de demostración, mis respuestas son limitadas. Te sugiero intentar preguntarme sobre: 'productos', 'facturas', 'dólares', 'reportes' o 'PDFs'.";
}

function SoportePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: getBotResponse(userMsg.content)
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200); // 1.2s delay to simulate thinking
  };

  return (
    <DashboardLayout title="Soporte Técnico" description="¿Necesitas ayuda? Habla con nuestro asistente interactivo.">
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="flex flex-col h-[600px] overflow-hidden">
          <CardHeader className="border-b bg-muted/20 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              Asistente StockPyme
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "flex gap-3 max-w-[80%] rounded-2xl px-4 py-3",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-muted text-foreground rounded-tl-sm"
                )}>
                  {msg.role === "bot" && <Bot className="h-5 w-5 shrink-0 mt-0.5" />}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.role === "user" && <User className="h-5 w-5 shrink-0 mt-0.5" />}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Bot className="h-5 w-5 shrink-0" />
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Escribe tu pregunta aquí..." 
                className="flex-1"
                disabled={isTyping}
              />
              <Button type="submit" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </form>
          </div>
        </Card>

        <Card className="bg-primary/5 border-primary/10 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Temas Sugeridos
            </CardTitle>
            <CardDescription>Prueba preguntarle al bot sobre:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full justify-start text-left h-auto py-3 whitespace-normal" onClick={() => setInput("¿Cómo agregar un nuevo producto?")}>
              ¿Cómo agregar un nuevo producto?
            </Button>
            <Button variant="secondary" className="w-full justify-start text-left h-auto py-3 whitespace-normal" onClick={() => setInput("¿Cómo funciona el cambio a dólares en las facturas?")}>
              Cambio de moneda en facturas
            </Button>
            <Button variant="secondary" className="w-full justify-start text-left h-auto py-3 whitespace-normal" onClick={() => setInput("Quiero descargar un reporte en PDF")}>
              Descargar reportes PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
