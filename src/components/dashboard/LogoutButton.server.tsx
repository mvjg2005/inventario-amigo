import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logoutFn } from "@/lib/auth.server";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutFn();
      router.invalidate();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar sesión">
      <LogOut className="h-4 w-4" />
      <span>Cerrar sesión</span>
    </SidebarMenuButton>
  );
}
