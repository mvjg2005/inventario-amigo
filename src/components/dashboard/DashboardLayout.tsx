import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

interface DashboardLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

const notifications = [
  { id: 1, title: "Stock crítico", body: "Leche en polvo 400g está sin inventario", time: "hace 5 min", tone: "rose" as const },
  { id: 2, title: "Orden recibida", body: "Pedido #1042 fue entregado al almacén", time: "hace 32 min", tone: "emerald" as const },
  { id: 3, title: "Bajo inventario", body: "Azúcar refinada 5Kg bajó del mínimo", time: "hace 1 h", tone: "amber" as const },
  { id: 4, title: "Reporte mensual", body: "El reporte de mayo está disponible", time: "hace 3 h", tone: "blue" as const },
];

const toneClass: Record<string, string> = {
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
};

export function DashboardLayout({ title, description, children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-base font-semibold leading-tight text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar producto, SKU…" className="h-9 w-64 pl-8" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Notificaciones</p>
                    <p className="text-xs text-muted-foreground">{notifications.length} sin leer</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Marcar leídas
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/40">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneClass[n.tone]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
                    Ver todas
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">MR</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
