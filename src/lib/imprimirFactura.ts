export function imprimirFactura(factura: {
  numero: string;
  cliente: string;
  fecha: string;
  total_bs: number;
  estado: string;
  detalles?: { producto: string; cantidad: number; precio_unitario: number; subtotal: number }[];
}) {
  const TIPO_CAMBIO = 6.96;
  const items = factura.detalles || [];
  
  let empresaNombre = "STOCKPYME";
  try {
    const empresaStr = localStorage.getItem("stockpyme_empresa");
    if (empresaStr) {
      const empresa = JSON.parse(empresaStr);
      if (empresa.nombre) {
        empresaNombre = empresa.nombre.toUpperCase();
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Formatear los ítems en HTML para el ticket
  const itemsHtml = items.length > 0 
    ? items.map(item => `
      <tr>
        <td style="padding: 6px 0; text-align: left; font-size: 12px;">
          ${item.producto}<br/>
          <small style="color: #555; font-family: monospace;">${item.cantidad} x Bs ${Number(item.precio_unitario).toFixed(2)}</small>
        </td>
        <td style="padding: 6px 0; text-align: right; vertical-align: bottom; font-size: 12px; font-family: monospace;">
          Bs ${Number(item.subtotal).toFixed(2)}
        </td>
      </tr>
    `).join('')
    : `
      <tr>
        <td style="padding: 6px 0; text-align: left; font-size: 12px;">Venta General</td>
        <td style="padding: 6px 0; text-align: right; font-size: 12px; font-family: monospace;">Bs ${Number(factura.total_bs).toFixed(2)}</td>
      </tr>
    `;

  const totalUsd = (Number(factura.total_bs) / TIPO_CAMBIO).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Factura ${factura.numero}</title>
        <meta charset="utf-8">
        <style>
          @media print {
            body { margin: 0; padding: 0; width: 80mm; }
            @page { margin: 0.5cm; }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            background-color: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }
          .header h2 {
            margin: 0 0 3px 0;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .header p {
            margin: 2px 0;
            font-size: 11px;
          }
          .info {
            margin-bottom: 12px;
            font-size: 11px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }
          .info p {
            margin: 2px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border-bottom: 1px dashed #000;
          }
          .table th {
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
          }
          .totals {
            text-align: right;
            margin-bottom: 15px;
            font-size: 12px;
          }
          .totals p {
            margin: 3px 0;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 8px;
            margin-top: 12px;
            color: #444;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #000;
            font-weight: bold;
            font-size: 10px;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${empresaNombre}</h2>
          <p>Control de Inventarios y Facturación</p>
          <p>Bolivia</p>
          <div class="badge">${factura.estado}</div>
        </div>
        
        <div class="info">
          <p><strong>FACTURA N°:</strong> ${factura.numero}</p>
          <p><strong>FECHA:</strong> ${factura.fecha}</p>
          <p><strong>CLIENTE:</strong> ${factura.cliente.toUpperCase()}</p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left;">Concepto</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>SUBTOTAL:</strong> Bs ${Number(factura.total_bs).toFixed(2)}</p>
          <p><strong>TOTAL NETO:</strong> Bs ${Number(factura.total_bs).toFixed(2)}</p>
          <p style="font-size: 11px; color: #333;">TOTAL USD: $${totalUsd} (T.C. ${TIPO_CAMBIO})</p>
        </div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p style="font-size: 8px; margin-top: 8px;">Factura generada de forma instantánea por Stocky AI Asistente.</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            // Cerrar la ventana tras la impresión si no es en desarrollo
            setTimeout(() => {
              window.close();
            }, 5000);
          }
        </script>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
