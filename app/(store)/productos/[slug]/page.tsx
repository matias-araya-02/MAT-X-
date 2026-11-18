import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Gallery } from '@/components/product/Gallery'
import { ProductCard } from '@/components/product/ProductCard'
import { calcularPrecioFinal } from '@/lib/pricing'
import { AddToCartButton } from '@/components/product/AddToCartButton'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProducto(slug: string) {
  return prisma.producto.findUnique({
    where: { slug, activo: true },
    include: {
      categoria: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { orderBy: { nombre: 'asc' } },
    },
  })
}

async function getRelacionados(categoriaSlug: string, excludeId: string) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      categoria: { slug: categoriaSlug },
      id: { not: excludeId },
    },
    include: {
      categoria: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
    },
    take: 4,
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const producto = await getProducto(slug)
  if (!producto) return { title: 'Producto no encontrado' }

  return {
    title: producto.nombre,
    description: producto.descripcion ?? `${producto.nombre} — MAT-X Periféricos Gaming`,
  }
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params
  const producto = await getProducto(slug)
  if (!producto) notFound()

  const relacionados = await getRelacionados(producto.categoria.slug, producto.id)
  const precioFinal = calcularPrecioFinal(producto.precio, producto.descuento)
  const tieneDescuento = producto.descuento && producto.descuento > 0
  const tieneVariantes = producto.variantes.length > 0

  // Stock total (si no tiene variantes, usa el del producto)
  const stockTotal = tieneVariantes
    ? producto.variantes.reduce((acc, v) => acc + v.stock, 0)
    : producto.stock

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="font-mono text-xs text-muted mb-8 flex gap-2">
        <a href="/" className="hover:text-text transition-colors">Inicio</a>
        <span>/</span>
        <a href="/productos" className="hover:text-text transition-colors">Productos</a>
        <span>/</span>
        <a href={`/productos?categoria=${producto.categoria.slug}`} className="hover:text-text transition-colors">
          {producto.categoria.nombre}
        </a>
        <span>/</span>
        <span className="text-text">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Galería */}
        <Gallery imagenes={producto.imagenes} nombre={producto.nombre} />

        {/* Info */}
        <div className="space-y-6">
          {/* Categoría label */}
          <span className="card-label">{producto.categoria.nombre}</span>

          {/* Nombre */}
          <h1 className="font-heading text-4xl font-bold uppercase leading-tight mt-3">
            {producto.nombre}
          </h1>

          {/* SKU */}
          {producto.sku && (
            <p className="font-mono text-xs text-muted">SKU: {producto.sku}</p>
          )}

          {/* Precio */}
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-4xl font-bold text-text">
              ${precioFinal.toLocaleString('es-AR')}
            </span>
            {tieneDescuento && (
              <>
                <span className="font-mono text-lg text-muted line-through">
                  ${producto.precio.toLocaleString('es-AR')}
                </span>
                <span className="badge-discount">-{producto.descuento}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className={`font-mono text-sm ${stockTotal > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {stockTotal > 0 ? `✓ En stock (${stockTotal} disponibles)` : '✗ Sin stock'}
          </p>

          {/* Descripción */}
          {producto.descripcion && (
            <p className="font-sans text-sm text-muted leading-relaxed">
              {producto.descripcion}
            </p>
          )}

          {/* Selector variante + botón carrito */}
          <AddToCartButton producto={producto} />

          {/* Info envío */}
          <div className="border border-primary/20 p-4 font-mono text-xs text-muted space-y-1">
            <p>📦 Envíos a todo el país — se coordina por WhatsApp</p>
            <p>💳 Descuento por transferencia bancaria</p>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading text-2xl font-bold uppercase mb-6">
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {relacionados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
