import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { HeroSlidesForm } from '@/components/admin/HeroSlidesForm'

export const metadata: Metadata = { title: 'Hero | Admin MAT-X' }
export const dynamic = 'force-dynamic'

export default async function AdminHeroPage() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: { orden: 'asc' },
    select: {
      productoId: true,
      palabra: true,
      activo: true,
      imagenUrl: true,
      imagenPublicId: true,
    },
  })

  // Productos activos, más los que ya están en algún slide (aunque se hayan desactivado)
  const productos = await prisma.producto.findMany({
    where: {
      OR: [{ activo: true }, { id: { in: slides.map((s) => s.productoId) } }],
    },
    select: {
      id: true,
      nombre: true,
      activo: true,
      marca: { select: { nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-2">Hero</h1>
      <p className="font-mono text-xs text-muted mb-6 max-w-2xl">
        Productos que rotan a la derecha del título de la home. Si no hay ningún slide activo,
        el hero se muestra como siempre, solo con el texto.
      </p>

      <HeroSlidesForm
        slides={slides}
        productos={productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          activo: p.activo,
          marca: p.marca?.nombre ?? null,
        }))}
      />
    </div>
  )
}
