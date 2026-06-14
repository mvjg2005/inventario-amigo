import { Link, useRouterState } from "@tanstack/react-router";
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Inventario Amigo</span>
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
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          Elaborado por <br />
          <strong className="text-foreground">Jehoseba Gabriela Muñoz Valdez</strong>
        </p>
      </div>
    </Sidebar>
  );
}
