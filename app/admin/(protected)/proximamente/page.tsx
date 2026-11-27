import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProximamenteForm } from '@/components/admin/ProximamenteForm'

export const metadata: Metadata = { title: 'Próximamente | Admin MAT-X' }
export const dynamic = 'force-dynamic'

export default async function AdminProximamentePage() {
  const [config, items, categorias, marcas] = await Promise.all([
    prisma.proximamenteConfig.findUnique({ where: { id: 1 } }),
    prisma.proximoIngreso.findMany({ orderBy: { orden: 'asc' } }),
    prisma.categoria.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: { id: true, nombre: true },
    }),
    prisma.marca.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
  ])

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-2">Próximamente</h1>
      <p className="font-mono text-xs text-muted mb-6 max-w-2xl">
        Sección de la home con los productos que todavía no llegaron. No afecta al catálogo ni al
        carrito. Si no hay ningún producto activo, la sección no se muestra.
      </p>

      <ProximamenteForm
        config={
          config
            ? {
                activo: config.activo,
                titulo: config.titulo,
                subtitulo: config.subtitulo,
                videoUrl: config.videoUrl,
                imagenUrl: config.imagenUrl,
                imagenPublicId: config.imagenPublicId,
                enlaceTexto: config.enlaceTexto,
                enlaceUrl: config.enlaceUrl,
              }
            : null
        }
        items={items.map((it) => ({
          nombre: it.nombre,
          categoriaId: it.categoriaId,
          marcaId: it.marcaId,
          llegada: it.llegada,
          precioEstimado: it.precioEstimado,
          activo: it.activo,
          imagenUrl: it.imagenUrl,
          imagenPublicId: it.imagenPublicId,
        }))}
        categorias={categorias}
        marcas={marcas}
      />
    </div>
  )
}
