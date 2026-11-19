import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/product/ProductCard'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Explorá todo nuestro catálogo de periféricos gaming.',
}

async function getCategorias() {
  return prisma.categoria.findMany({ orderBy: { orden: 'asc' } })
}

async function getProductos(categoriaSlug?: string) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      ...(categoriaSlug ? { categoria: { slug: categoriaSlug } } : {}),
    },
    include: {
      categoria: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getConfig() {
  const config = await prisma.config.findUnique({ where: { id: 1 } })
  return config?.descuentoTransferencia ?? 0
}

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

export default async function ProductosPage({ searchParams }: Props) {
  const { categoria } = await searchParams
  const [categorias, productos, descuentoTransferencia] = await Promise.all([
    getCategorias(),
    getProductos(categoria),
    getConfig(),
  ])

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Filtros por categoría */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/productos"
          className={`px-4 py-2 font-sans text-sm font-medium uppercase tracking-wider border transition-colors ${
            !categoria
              ? 'bg-primary text-white border-primary'
              : 'border-primary/30 text-muted hover:border-primary hover:text-text'
          }`}
        >
          Todos
        </Link>
        {categorias.map((cat) => (
          <Link
            key={cat.id}
            href={`/productos?categoria=${cat.slug}`}
            className={`px-4 py-2 font-sans text-sm font-medium uppercase tracking-wider border transition-colors ${
              categoria === cat.slug
                ? 'bg-primary text-white border-primary'
                : 'border-primary/30 text-muted hover:border-primary hover:text-text'
            }`}
          >
            {cat.nombre}
          </Link>
        ))}
      </div>

      {/* Contador */}
      <p className="font-mono text-xs text-muted mb-6">
        {productos.length} producto{productos.length !== 1 ? 's' : ''}
        {categoria && ` en ${categorias.find(c => c.slug === categoria)?.nombre}`}
      </p>

      {/* Grid */}
      {productos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <ProductCard
              key={p.id}
              producto={p}
              descuentoTransferencia={descuentoTransferencia}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-mono text-muted">No hay productos en esta categoría.</p>
          <Link href="/productos" className="btn-primary inline-block mt-6">
            Ver todos
          </Link>
        </div>
      )}
    </div>
  )
}
