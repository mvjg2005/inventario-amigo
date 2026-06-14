import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Stock = "normal" | "bajo" | "sin";

interface Movement {
  id: string;
  product: string;
  sku: string;
  type: "entrada" | "salida";
  qty: number;
  date: string;
  stock: Stock;
}

const data: Movement[] = [
  { id: "MV-2041", product: "Aceite vegetal 1L", sku: "ACV-001", type: "entrada", qty: 120, date: "Hoy, 10:24", stock: "normal" },
  { id: "MV-2040", product: "Azúcar refinada 5Kg", sku: "AZR-050", type: "salida", qty: 18, date: "Hoy, 09:11", stock: "bajo" },
  { id: "MV-2039", product: "Detergente líquido 2L", sku: "DTL-200", type: "salida", qty: 32, date: "Ayer, 17:48", stock: "normal" },
  { id: "MV-2038", product: "Café molido 250g", sku: "CFM-025", type: "entrada", qty: 60, date: "Ayer, 14:02", stock: "normal" },
  { id: "MV-2037", product: "Leche en polvo 400g", sku: "LCP-040", type: "salida", qty: 24, date: "Ayer, 11:30", stock: "sin" },
  { id: "MV-2036", product: "Arroz grano fino 5Kg", sku: "ARG-050", type: "salida", qty: 45, date: "27 May, 16:09", stock: "bajo" },
  { id: "MV-2035", product: "Galletas saladas 200g", sku: "GLS-020", type: "entrada", qty: 200, date: "27 May, 09:45", stock: "normal" },
];

const stockLabel: Record<Stock, string> = { normal: "Normal", bajo: "Bajo", sin: "Sin inventario" };

export function MovementsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos recientes</CardTitle>
        <CardDescription>Entradas y salidas registradas en el almacén</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Inventario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{m.product}</div>
                  <div className="text-xs text-muted-foreground">{m.sku}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 font-medium",
                      m.type === "entrada"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                  >
                    {m.type === "entrada" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    {m.type === "entrada" ? "Entrada" : "Salida"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{m.qty}</TableCell>
                <TableCell className="text-muted-foreground">{m.date}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      m.stock === "normal" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                      m.stock === "bajo" && "border-amber-200 bg-amber-50 text-amber-700",
                      m.stock === "sin" && "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                  >
                    {stockLabel[m.stock]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
