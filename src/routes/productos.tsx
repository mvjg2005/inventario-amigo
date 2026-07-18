import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus, Filter, Download, Search, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, formatMoney, getCurrencyLabel } from "@/lib/utils";
import { getProductsFn, createProductFn, updateProductFn, deleteProductFn } from "./productos.server";
import { toast } from "sonner";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [{ title: "Productos — StockPyme" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
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
  const { q } = Route.useSearch();

  const [filterEstado, setFilterEstado] = useState<Estado | "todos">("todos");
  const [searchTerm, setSearchTerm] = useState(q ?? "");

  // Sync searchTerm when navigating from global search bar
  useEffect(() => {
    if (q) setSearchTerm(q);
  }, [q]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({ sku: "", nombre: "", categoria: "", precio: "", stock: "" });

  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);

  const handleOpenDialog = (producto?: Producto) => {
    const isUsd = getCurrencyLabel() === "USD";
    if (producto) {
      setEditingProduct(producto);
      const displayPrice = isUsd ? (producto.precio / 6.96).toFixed(2) : producto.precio.toString();
      setFormData({
        sku: producto.sku,
        nombre: producto.nombre,
        categoria: producto.categoria || "",
        precio: displayPrice,
        stock: producto.stock.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({ sku: "", nombre: "", categoria: "", precio: "", stock: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockNum = parseInt(formData.stock);
    const estado = stockNum === 0 ? "sin" : stockNum <= 20 ? "bajo" : "normal";

    const isUsd = getCurrencyLabel() === "USD";
    const inputPrice = parseFloat(formData.precio);
    const precioBs = isUsd ? inputPrice * 6.96 : inputPrice;

    try {
      if (editingProduct) {
        await updateProductFn({
          data: {
            id: editingProduct.id,
            sku: formData.sku,
            nombre: formData.nombre,
            categoria: formData.categoria,
            precio: precioBs,
            stock: stockNum,
            estado
          }
        } as any);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProductFn({
          data: {
            sku: formData.sku,
            nombre: formData.nombre,
            categoria: formData.categoria,
            precio: precioBs,
            stock: stockNum,
            estado
          }
        } as any);
        toast.success("Producto creado correctamente");
      }

      setIsDialogOpen(false);
      router.invalidate();
    } catch (error: any) {
      console.error("Error al guardar producto:", error);
      toast.error(error.message || "Error al guardar el producto");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProductFn({ data: { id: productToDelete.id } } as any);
      toast.success("Producto eliminado correctamente");
      setProductToDelete(null);
      router.invalidate();
    } catch (error: any) {
      console.error("Error al eliminar producto:", error);
      toast.error(error.message || "Error al eliminar el producto");
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

  const filteredProducts = productos.filter(p => {
    const matchesFilter = filterEstado === "todos" || p.estado === filterEstado;
    const matchesSearch = searchTerm === "" ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout title="Productos" description="Catálogo completo del inventario">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar producto..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" title="Filtrar por estado"><Filter className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem checked={filterEstado === "todos"} onCheckedChange={() => setFilterEstado("todos")}>Todos</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterEstado === "normal"} onCheckedChange={() => setFilterEstado("normal")}>Normal</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterEstado === "bajo"} onCheckedChange={() => setFilterEstado("bajo")}>Bajo</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterEstado === "sin"} onCheckedChange={() => setFilterEstado("sin")}>Sin inventario</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={handleExport} className="shrink-0" title="Exportar CSV"><Download className="h-4 w-4" /></Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nuevo producto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar producto" : "Añadir nuevo producto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del producto</Label>
                <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input id="categoria" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio ({getCurrencyLabel()})</Label>
                  <Input id="precio" type="number" step="0.01" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" className="w-full">{editingProduct ? "Actualizar producto" : "Guardar producto"}</Button>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
                "{productToDelete?.nombre}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
      <Card>
        <CardContent className="p-0">
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio ({getCurrencyLabel()})</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p: Producto) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{p.categoria || '-'}</TableCell>
                    <TableCell className="text-right tabular-nums font-mono">{formatMoney(p.precio)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "font-medium",
                        p.estado === "normal" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                        p.estado === "bajo" && "border-amber-200 bg-amber-50 text-amber-700",
                        p.estado === "sin" && "border-rose-200 bg-rose-50 text-rose-700",
                      )}>{label[p.estado]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(p)} title="Editar">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setProductToDelete(p)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay productos que coincidan con los filtros de búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
