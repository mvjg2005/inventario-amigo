import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — StockPyme" }] }),
  component: UsuariosPage,
});

const usuarios = [
  { nombre: "María Rojas", email: "maria.rojas@stockpyme.bo", rol: "Administrador", estado: "activo", ultimo: "Hoy" },
  { nombre: "Carlos Vargas", email: "carlos.vargas@stockpyme.bo", rol: "Almacenero", estado: "activo", ultimo: "Hoy" },
  { nombre: "Lucía Mamani", email: "lucia.mamani@stockpyme.bo", rol: "Vendedor", estado: "activo", ultimo: "Ayer" },
  { nombre: "Jorge Quispe", email: "jorge.quispe@stockpyme.bo", rol: "Contador", estado: "inactivo", ultimo: "Hace 7 días" },
  { nombre: "Andrea Flores", email: "andrea.flores@stockpyme.bo", rol: "Vendedor", estado: "activo", ultimo: "Hoy" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function UsuariosPage() {
  return (
    <DashboardLayout title="Usuarios" description="Gestión del equipo y permisos">
      <div className="flex items-center justify-end">
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Invitar usuario</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(u.nombre)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{u.nombre}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.rol}</TableCell>
                  <TableCell className="text-muted-foreground">{u.ultimo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-medium",
                      u.estado === "activo" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted text-muted-foreground",
                    )}>{u.estado === "activo" ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
