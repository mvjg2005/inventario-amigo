import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Stock = "normal" | "bajo" | "sin";

export interface Movement {
  id: string;
  product: string;
  sku: string;
  type: "entrada" | "salida";
  qty: number;
  date: string;
  stock: Stock;
}

const stockLabel: Record<Stock, string> = { normal: "Normal", bajo: "Bajo", sin: "Sin inventario" };

interface MovementsTableProps {
  data: Movement[];
}

export function MovementsTable({ data }: MovementsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos recientes</CardTitle>
        <CardDescription>Entradas y salidas registradas en el almacén</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
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
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
