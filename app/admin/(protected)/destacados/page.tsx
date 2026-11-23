import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { DestacadosForm } from '@/components/admin/DestacadosForm'

export const metadata: Metadata = { title: 'Destacados | Admin MAT-X' }

export default async function AdminDestacadosPage() {
  const [productos, destacados] = await Promise.all([
    prisma.producto.findMany({
      // Incluye un producto inactivo si ya está elegido, para que no desaparezca del selector
      where: { OR: [{ activo: true }, { destacadosHome: { some: {} } }] },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.destacadoHome.findMany({ orderBy: { orden: 'asc' } }),
  ])

  const iniciales = [0, 1, 2].map((orden) => {
    const d = destacados.find((x) => x.orden === orden)
    return d
      ? { productoId: d.productoId, imagenUrl: d.imagenUrl, imagenPublicId: d.imagenPublicId }
      : null
  })

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-2">Destacados de la home</h1>
      <p className="font-mono text-sm text-muted mb-8">
        Elegí hasta 3 productos y subí una imagen para cada uno.
      </p>
      <DestacadosForm productos={productos} iniciales={iniciales} />
    </div>
  )
}
