import { createFileRoute } from '@tanstack/react-router';
import { useRouter } from "@tanstack/react-router";
import { Plus, Filter, Download } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getProductsFn, createProductFn } from "./productos.server";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [{ title: "Productos — StockPyme" }] }),
  loader: async () => {
    const result = await getProductsFn();
    return result || [];
  },
  component: ProductosPage,
});

type Estado = "normal" | "bajo" | "sin";
const label = { normal: "Normal", bajo: "Bajo", sin: "Sin inventario" } as const;

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  estado: Estado;
}

function ProductosPage() {
  const router = useRouter();
  const productos = Route.useLoaderData() as Producto[];
  
  const [filterEstado, setFilterEstado] = useState<Estado | "todos">("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ sku: "", nombre: "", categoria: "", precio: "", stock: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockNum = parseInt(formData.stock);
    const estado = stockNum === 0 ? "sin" : stockNum <= 20 ? "bajo" : "normal";
    
    try {
      await createProductFn({
        sku: formData.sku,
        nombre: formData.nombre,
        categoria: formData.categoria,
        precio: parseFloat(formData.precio),
        stock: stockNum,
        estado
      });
      
      setIsDialogOpen(false);
      setFormData({ sku: "", nombre: "", categoria: "", precio: "", stock: "" });
      router.invalidate();
    } catch (error) {
      console.error("Error al crear producto:", error);
      alert("Error al guardar el producto");
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["SKU", "Producto", "Categoria", "Precio", "Stock", "Estado"],
      ...productos.map(p => [p.sku, p.nombre, p.categoria, p.precio, p.stock, label[p.estado as Estado]])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = productos.filter(p => filterEstado === "todos" || p.estado === filterEstado);

  return (
    <DashboardLayout title="Productos" description="Catálogo completo del inventario">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtrar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem checked={filterEstado === "todos"} onCheckedChange={() => setFilterEstado("todos")}>Todos</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterEstado === "normal"} onCheckedChange={() => setFilterEstado("normal")}>Normal</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterEstado === "bajo"} onCheckedChange={() => setFilterEstado("bajo")}>Bajo</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterEstado === "sin"} onCheckedChange={() => setFilterEstado("sin")}>Sin inventario</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar</Button>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Nuevo producto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir nuevo producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del producto</Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input id="categoria" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio (Bs)</Label>
                  <Input id="precio" type="number" step="0.01" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock inicial</Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Guardar producto</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio (Bs)</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p: Producto) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{p.categoria}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(p.precio).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-medium",
                      p.estado === "normal" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                      p.estado === "bajo" && "border-amber-200 bg-amber-50 text-amber-700",
                      p.estado === "sin" && "border-rose-200 bg-rose-50 text-rose-700",
                    )}>{label[p.estado]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay productos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
