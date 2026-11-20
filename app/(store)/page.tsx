import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/home/Hero'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { ProductCard } from '@/components/product/ProductCard'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Inicio',
  description:
    'Periféricos gaming de alto rendimiento. Teclados mecánicos, auriculares, cables y controladoras.',
}

async function getDestacados() {
  return prisma.producto.findMany({
    where: { activo: true, destacado: true },
    include: {
      categoria: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })
}

async function getConfig() {
  const config = await prisma.config.findUnique({ where: { id: 1 } })
  return config?.descuentoTransferencia ?? 0
}

export default async function HomePage() {
  const [destacados, descuentoTransferencia] = await Promise.all([
    getDestacados(),
    getConfig(),
  ])

  return (
    <div>
      <Hero />

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-bold uppercase md:text-4xl">
            Más vendidos
          </h2>
          <Link href="/productos" className="btn-outline !px-4 !py-2 text-sm">
            Ver todos
          </Link>
        </div>

        {destacados.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {destacados.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                descuentoTransferencia={descuentoTransferencia}
              />
            ))}
          </div>
        ) : (
          <p className="font-mono text-muted text-center py-12">
            No hay productos destacados todavía.
          </p>
        )}
      </section>

      <CategoryGrid />
    </div>
  )
}