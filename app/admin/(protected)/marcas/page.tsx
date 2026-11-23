import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { EliminarMarcaButton } from '@/components/admin/EliminarMarcaButton'

export const metadata: Metadata = { title: 'Marcas | Admin MAT-X' }
export const dynamic = 'force-dynamic'

export default async function AdminMarcasPage() {
  const marcas = await prisma.marca.findMany({
    include: { _count: { select: { productos: true } } },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold uppercase">Marcas</h1>
        <Link href="/admin/marcas/nueva" className="btn-primary text-sm px-4 py-2">
          + Nueva Marca
        </Link>
      </div>

      <div className="bg-surface border border-primary/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Logo</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Marca</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Slug</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Productos</th>
              <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marcas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-mono text-xs text-muted">
                  Todavía no hay marcas. Creá la primera con “Nueva Marca”.
                </td>
              </tr>
            ) : (
              marcas.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-primary/10 hover:bg-background transition-colors"
                >
                  <td className="px-4 py-3">
                    {m.logoUrl ? (
                      <div className="relative h-10 w-24 border border-primary/10 bg-white">
                        <Image
                          src={m.logoUrl}
                          alt={`Logo de ${m.nombre}`}
                          fill
                          sizes="96px"
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-heading font-semibold text-sm">{m.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{m.slug}</td>
                  <td className="px-4 py-3 font-mono text-sm">{m._count.productos}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-4">
                      <Link
                        href={`/admin/marcas/${m.id}/editar`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        Editar
                      </Link>
                      <EliminarMarcaButton
                        marcaId={m.id}
                        nombre={m.nombre}
                        productos={m._count.productos}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
