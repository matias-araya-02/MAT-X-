import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ToggleProductoActivo } from '@/components/admin/ToggleProductoActivo'

export const metadata: Metadata = { title: 'Productos | Admin MAT-X' }
export const dynamic = 'force-dynamic'

export default async function AdminProductosPage() {
  const productos = await prisma.producto.findMany({
    include: {
      categoria: { select: { nombre: true } },
      variantes: { select: { id: true, stock: true } },
      imagenes: { select: { url: true }, orderBy: { orden: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold uppercase">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-primary text-sm px-4 py-2">
          + Nuevo Producto
        </Link>
      </div>

      <div className="bg-surface border border-primary/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Producto</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Categoría</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Precio</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Stock</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Destacado</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Activo</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const stockTotal = p.variantes.length > 0
                ? p.variantes.reduce((acc, v) => acc + v.stock, 0)
                : p.stock
              const precioFinal = p.descuento
                ? Math.round(p.precio * (1 - p.descuento / 100))
                : p.precio

              return (
                <tr key={p.id} className="border-b border-primary/10 hover:bg-background transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-heading font-semibold text-sm truncate max-w-[180px]">{p.nombre}</p>
                    <p className="font-mono text-xs text-muted">{p.sku ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{p.categoria.nombre}</td>
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-sm">${precioFinal.toLocaleString('es-AR')}</p>
                    {p.descuento ? (
                      <p className="font-mono text-xs text-muted line-through">${p.precio.toLocaleString('es-AR')}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-bold ${stockTotal <= 0 ? 'text-red-500' : stockTotal < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {stockTotal}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {p.destacado ? '⭐' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleProductoActivo productoId={p.id} activo={p.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${p.id}/editar`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
