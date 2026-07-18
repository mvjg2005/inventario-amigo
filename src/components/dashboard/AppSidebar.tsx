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
  useSidebar,
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
  const { isMobile, setOpenMobile } = useSidebar();
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

  const closeMobileNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = async () => {
    await logoutFn();
    router.invalidate();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="max-w-[140px] truncate text-sm font-semibold" title={empresaNombre}>{empresaNombre}</span>
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
                      <Link to={item.url} onClick={closeMobileNav}>
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
      <div className="mt-auto flex flex-col border-t border-sidebar-border">
        {user && (
          <div className="flex items-center justify-between gap-2 border-b border-sidebar-border p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <UserAvatarFace user={user} />
              <div className="flex min-w-0 flex-col truncate pr-2">
                <span className="truncate text-sm font-medium" title={getDisplayName(user)}>
                  {getDisplayName(user)}
                </span>
                <span className="truncate text-xs text-muted-foreground" title={user.email}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-3 sm:p-4">
          <p className="text-center text-[10px] leading-tight text-muted-foreground">
            Elaborado por <br />
            <strong className="text-foreground">Jehoseba Gabriela Muñoz Valdez</strong>
          </p>
        </div>
      </div>
    </Sidebar>
  );
}
