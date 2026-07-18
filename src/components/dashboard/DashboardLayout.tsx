import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Bell, Search, AlertTriangle, PackageX, CheckCircle, X } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AiChatBot } from "@/components/dashboard/AiChatBot";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { getDashboardKpisFn } from "@/routes/index.server";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { loadSystemPrefs } from "@/lib/systemPrefs";

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
  // @ts-ignore — user viene del beforeLoad de __root__
  const context = useRouteContext({ from: "__root__" }) as { user?: unknown };
  const user = context?.user as any;
  const [searchValue, setSearchValue] = useState("");
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());
  const [loadingAlertas, setLoadingAlertas] = useState(true);
  const [mostrarAlertas, setMostrarAlertas] = useState(true);

  // Preferencia: alertas de bajo inventario
  useEffect(() => {
    const syncPrefs = () => setMostrarAlertas(loadSystemPrefs().alertasBajoInventario);
    syncPrefs();
    window.addEventListener("stockpyme-prefs-changed", syncPrefs);
    window.addEventListener("storage", syncPrefs);
    return () => {
      window.removeEventListener("stockpyme-prefs-changed", syncPrefs);
      window.removeEventListener("storage", syncPrefs);
    };
  }, []);

  // ─── Cargar alertas reales desde Supabase ─────────────────────────────────
  useEffect(() => {
    if (!mostrarAlertas) {
      setAlertas([]);
      setLoadingAlertas(false);
      return;
    }
    const cargar = async () => {
      setLoadingAlertas(true);
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
  }, [mostrarAlertas]);

  const sinLeer = mostrarAlertas ? alertas.filter(a => !leidas.has(a.sku)).length : 0;

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
        <header className="sticky top-0 z-10 flex min-h-14 flex-wrap items-center gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur sm:min-h-16 sm:gap-3 sm:px-4 lg:px-6">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div className="min-w-0 flex-1 sm:flex-none sm:max-w-[min(100%,280px)] md:max-w-xs">
            <h1 className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base">{title}</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* ─── Buscador funcional (escritorio) ─── */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar producto, SKU…"
                className="h-9 w-48 pl-8 pr-8 lg:w-64"
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

            {/* ─── Buscador móvil (icono → productos) ─── */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Buscar productos"
              onClick={() => navigate({ to: "/productos" })}
            >
              <Search className="h-4 w-4" />
            </Button>

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
              <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] p-0">
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

            <div className="flex items-center gap-2">
              {user?.email && (
                <span
                  className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:inline"
                  title={user.email}
                >
                  {user.email}
                </span>
              )}
              <UserMenu user={user} />
            </div>
          </div>
        </header>
        <main className="flex-1 space-y-4 overflow-x-hidden p-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:p-4 sm:pb-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
      <AiChatBot />
    </SidebarProvider>
  );
}
