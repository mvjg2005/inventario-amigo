import{d as y,A as x,y as t,D as m}from"./index-DvJqr6iu.js";import{D as f,F as g}from"./DashboardLayout-DqlIfF76.js";import{j as c,C as D,d as j,e as v,b as $,a as w,B as C,m as P}from"./card-Keg8EOUa.js";import{T as R}from"./TopProductsChart-9RYr_yIe.js";import{D as E}from"./download-Nu33dUZv.js";import"./circle-check-big-Blw0vAN2.js";const N=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],k=c("calendar",N);const T=[["path",{d:"M5 21v-6",key:"1hz6c0"}],["path",{d:"M12 21V3",key:"1lcnhd"}],["path",{d:"M19 21V9",key:"unv183"}]],M=c("chart-no-axes-column",T);const O=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],S=c("trending-up",O),b=[{id:"inv",title:"Inventario mensual",desc:"Resumen valorizado por categoría",icon:g},{id:"rot",title:"Rotación de productos",desc:"Análisis de movimiento por SKU",icon:S},{id:"com",title:"Compras y proveedores",desc:"Órdenes recibidas y pendientes",icon:k},{id:"mer",title:"Mermas y ajustes",desc:"Diferencias y descuentos de inventario",icon:M}];function L(){const a=y.useLoaderData(),[d,l]=x.useState(null),p=(o,r)=>{l(o),m.info(`Generando ${r}...`),setTimeout(()=>{l(null);const u=new Date().toLocaleDateString("es-BO");let e=`REPORTE: ${r.toUpperCase()}
Fecha: ${u}

`;if(o==="inv"){const i=P(a.valorInventario);e+=`RESUMEN DE INVENTARIO
${"─".repeat(40)}
`,e+=`Total de productos: ${a.totalProductos}
`,e+=`Valor total del inventario: ${i}
`,e+=`Productos sin stock: ${a.alertas.filter(s=>s.severity==="out").length}
`,e+=`Productos con stock bajo: ${a.alertas.filter(s=>s.severity==="low").length}
`}else o==="rot"?(e+=`ROTACIÓN DE PRODUCTOS
${"─".repeat(40)}
`,e+=`Rotación promedio del mes: ${a.rotacionPromedio}x

`,e+=`TOP PRODUCTOS MÁS VENDIDOS:
`,a.topProductos.forEach((i,s)=>{e+=`  ${s+1}. ${i.product} — ${i.ventas} unidades
`})):o==="com"?(e+=`COMPRAS Y PROVEEDORES
${"─".repeat(40)}
`,e+=`Ver sección Órdenes para el detalle completo.
`):o==="mer"&&(e+=`MERMAS Y AJUSTES
${"─".repeat(40)}
`,e+=`Porcentaje de error/merma: ${a.porcentajeError}%
`,e+=`Productos afectados: ${a.alertas.length}
`);const n=window.open("","_blank");n&&(n.document.write(`<html><head><title>${r}</title>
          <style>body{font-family:monospace;padding:2rem;white-space:pre-wrap;}</style>
          </head><body>${e}</body></html>`),n.document.close(),n.print(),m.success(`${r} listo para guardar como PDF`))},1200)},h=new Date().toLocaleString("es-BO",{month:"long",year:"numeric"});return t.jsxs(f,{title:"Reportes",description:"Genera y descarga reportes detallados con datos reales",children:[t.jsx(R,{data:a.topProductos}),t.jsx("section",{className:"grid gap-4 sm:grid-cols-2 lg:grid-cols-4",children:b.map(o=>t.jsxs(D,{children:[t.jsxs(j,{children:[t.jsx("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary",children:t.jsx(o.icon,{className:"h-5 w-5"})}),t.jsx(v,{className:"mt-3 text-base",children:o.title}),t.jsx($,{children:o.desc})]}),t.jsxs(w,{className:"flex items-center justify-between",children:[t.jsx("span",{className:"text-xs text-muted-foreground capitalize",children:h}),t.jsx(C,{variant:"outline",size:"sm",onClick:()=>p(o.id,o.title),disabled:d===o.id,children:d===o.id?"Generando...":t.jsxs(t.Fragment,{children:[t.jsx(E,{className:"mr-2 h-4 w-4"}),"PDF"]})})]})]},o.id))})]})}export{L as component};
