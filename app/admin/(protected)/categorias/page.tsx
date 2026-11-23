import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DeleteCategoriaButton } from '@/components/admin/DeleteCategoriaButton'

export const metadata: Metadata = { title: 'Categorías | Admin MAT-X' }

export default async function AdminCategoriasPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    include: { _count: { select: { productos: true } } },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase">Categorías</h1>
        <Link href="/admin/categorias/nueva" className="btn-primary px-6">
          Nueva categoría
        </Link>
      </div>

      {categorias.length === 0 ? (
        <p className="font-mono text-sm text-muted py-12 text-center">
          Todavía no hay categorías.
        </p>
      ) : (
        <div className="border border-primary/20 bg-white overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-primary/20 font-mono text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-normal">Orden</th>
                <th className="px-4 py-3 font-normal">Nombre</th>
                <th className="px-4 py-3 font-normal">Slug</th>
                <th className="px-4 py-3 font-normal">Descripción</th>
                <th className="px-4 py-3 font-normal">Productos</th>
                <th className="px-4 py-3 font-normal text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id} className="border-b border-primary/10 last:border-0 font-mono text-sm">
                  <td className="px-4 py-3 text-muted">{c.orden}</td>
                  <td className="px-4 py-3 font-bold">
                    <span className="inline-flex items-center gap-3">
                      {c.imagenUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imagenUrl}
                          alt=""
                          className="h-10 w-14 border border-primary/20 object-cover"
                        />
                      )}
                      {c.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.slug}</td>
                  <td className="px-4 py-3 text-muted">{c.descripcion ?? '—'}</td>
                  <td className="px-4 py-3">{c._count.productos}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/categorias/${c.id}/editar`}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteCategoriaButton
                        id={c.id}
                        nombre={c.nombre}
                        cantidadProductos={c._count.productos}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
