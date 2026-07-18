import { Link, useRouterState, useRouteContext, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  FileBarChart,
  ShoppingCart,
  Users,
  Settings,
  Boxes,
  Receipt,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { logoutFn } from "@/lib/auth.server";
import { UserAvatarFace } from "@/components/dashboard/UserMenu";
import { getDisplayName } from "@/lib/userProfile";

const items = [
  { title: "Panel", icon: LayoutDashboard, url: "/" as const },
  { title: "Productos", icon: Package, url: "/productos" as const },
  { title: "Movimientos", icon: ArrowLeftRight, url: "/movimientos" as const },
  { title: "Alertas", icon: AlertTriangle, url: "/alertas" as const },
  { title: "Reportes", icon: FileBarChart, url: "/reportes" as const },
  { title: "Órdenes", icon: ShoppingCart, url: "/ordenes" as const },
  { title: "Usuarios", icon: Users, url: "/usuarios" as const },
  { title: "Facturas", icon: Receipt, url: "/facturas" as const },
  { title: "Soporte", icon: LifeBuoy, url: "/soporte" as const },
  { title: "Configuración", icon: Settings, url: "/configuracion" as const },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [empresaNombre, setEmpresaNombre] = useState("Inventario Amigo");

  useEffect(() => {
    try {
      const empresaStr = localStorage.getItem("stockpyme_empresa");
      if (empresaStr) {
        const empresa = JSON.parse(empresaStr);
        if (empresa.nombre) {
          setEmpresaNombre(empresa.nombre);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  
  // @ts-ignore
  const context = useRouteContext({ from: "__root__" }) as any;
  const user = context?.user;

  const handleLogout = async () => {
    await logoutFn();
    router.invalidate();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold truncate max-w-[140px]" title={empresaNombre}>{empresaNombre}</span>
            <span className="text-xs text-muted-foreground">Inventario Premium</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto border-t border-sidebar-border flex flex-col">
        {user && (
          <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <UserAvatarFace user={user} />
              <div className="flex flex-col truncate pr-2 min-w-0">
                <span className="text-sm font-medium truncate" title={getDisplayName(user)}>
                  {getDisplayName(user)}
                </span>
                <span className="text-xs text-muted-foreground truncate" title={user.email}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-4">
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            Elaborado por <br />
            <strong className="text-foreground">Jehoseba Gabriela Muñoz Valdez</strong>
          </p>
        </div>
      </div>
    </Sidebar>
  );
}
