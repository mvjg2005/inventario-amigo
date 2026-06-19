import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { deleteAllUserProductsFn } from './productos.server';

export const Route = createFileRoute('/admin/limpiar-datos')({
  head: () => ({ meta: [{ title: "Limpiar Datos — StockPyme" }] }),
  component: LimpiarDatosPage,
});

function LimpiarDatosPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteProducts = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const result = await deleteAllUserProductsFn();
      setMessage({
        type: 'success',
        text: result.message || 'Datos eliminados correctamente. Ahora puedes cargar nuevos datos.'
      });
      setConfirmDelete(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Limpiar Datos" description="Administración de datos del inventario">
      <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Limpiar Datos</h1>
          <p className="text-muted-foreground mt-2">
            Administración de datos del inventario
          </p>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle>Eliminar todos los productos</CardTitle>
                <CardDescription>
                  Esta acción no se puede deshacer
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Al hacer clic, se eliminarán <strong>TODOS</strong> los productos de tu inventario.
                Esta acción es permanente y no se puede deshacer.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">¿Por qué usar esta función?</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Empezar con un inventario vacío</li>
                <li>Remover datos de prueba o demostración</li>
                <li>Preparar el sistema para datos reales</li>
              </ul>
            </div>

            {confirmDelete ? (
              <div className="space-y-3 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  ⚠️ Confirmar eliminación
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Haz clic en "Eliminar definitivamente" para confirmar la eliminación de todos los productos.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProducts}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleDeleteProducts}
                disabled={isDeleting}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isDeleting ? 'Procesando...' : 'Vaciar inventario'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información importante</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-muted-foreground">
            <p>
              ✅ Después de vaciar el inventario, solo veras los productos que tu crees
            </p>
            <p>
              ✅ Los datos se guardan automáticamente en Supabase
            </p>
            <p>
              ✅ Cada usuario tiene su propio inventario separado
            </p>
            <p>
              ✅ Los cambios se sincronizar automáticamente entre dispositivos
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
