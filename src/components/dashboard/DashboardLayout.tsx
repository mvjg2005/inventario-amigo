import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Bell, Search, AlertTriangle, PackageX, CheckCircle, X } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AiChatBot } from "@/components/dashboard/AiChatBot";
import { getDashboardKpisFn } from "@/routes/index.server";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

interface Alerta {
  product: string;
  sku: string;
  stock: number;
  min: number;
  severity: "low" | "out";
}

export function DashboardLayout({ title, description, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());
  const [loadingAlertas, setLoadingAlertas] = useState(true);

  // ─── Cargar alertas reales desde Supabase ─────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const kpis = await getDashboardKpisFn();
        setAlertas(kpis.alertas);
      } catch {
        setAlertas([]);
      } finally {
        setLoadingAlertas(false);
      }
    };
    cargar();
  }, []);

  const sinLeer = alertas.filter(a => !leidas.has(a.sku)).length;

  const marcarTodasLeidas = () => {
    setLeidas(new Set(alertas.map(a => a.sku)));
  };

  // ─── Buscador: navega a /productos con ?q=término ─────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate({ to: "/productos", search: { q: searchValue.trim() } });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

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
            {/* ─── Buscador funcional ─── */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar producto, SKU…"
                className="h-9 w-64 pl-8 pr-8"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* ─── Notificaciones reales ─── */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
                  <Bell className="h-4 w-4" />
                  {sinLeer > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                      {sinLeer > 9 ? "9+" : sinLeer}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Notificaciones</p>
                    <p className="text-xs text-muted-foreground">
                      {loadingAlertas ? "Cargando…" : sinLeer > 0 ? `${sinLeer} sin leer` : "Todo al día ✓"}
                    </p>
                  </div>
                  {sinLeer > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={marcarTodasLeidas}>
                      Marcar leídas
                    </Button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loadingAlertas ? (
                    <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                      Cargando alertas…
                    </div>
                  ) : alertas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <p className="text-sm font-medium text-foreground">Sin alertas activas</p>
                      <p className="text-xs text-muted-foreground">Tu inventario está en buen estado</p>
                    </div>
                  ) : (
                    alertas.map((a) => {
                      const isLeida = leidas.has(a.sku);
                      return (
                        <div
                          key={a.sku}
                          className={cn(
                            "flex gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors",
                            isLeida ? "opacity-50" : "hover:bg-muted/40 cursor-pointer"
                          )}
                          onClick={() => setLeidas(prev => new Set([...prev, a.sku]))}
                        >
                          <span className="mt-1.5 shrink-0">
                            {a.severity === "out"
                              ? <PackageX className="h-4 w-4 text-rose-500" />
                              : <AlertTriangle className="h-4 w-4 text-amber-500" />
                            }
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {a.severity === "out" ? "Sin inventario" : "Stock bajo"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {a.product} — Stock actual: <span className="font-semibold">{a.stock}</span> (mín. {a.min})
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{a.sku}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-border p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={() => navigate({ to: "/alertas" })}
                  >
                    Ver todas las alertas
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
      <AiChatBot />
    </SidebarProvider>
  );
}
