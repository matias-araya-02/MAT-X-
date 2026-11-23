import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Gallery } from '@/components/product/Gallery'
import { ProductCard } from '@/components/product/ProductCard'
import { calcularPrecioFinal } from '@/lib/pricing'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { Truck, CreditCard, ChevronRight } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProducto(slug: string) {
  return prisma.producto.findUnique({
    where: { slug, activo: true },
    include: {
      categoria: { select: { nombre: true, slug: true } },
      marca: { select: { nombre: true, slug: true } },
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
      marca: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
    },
    take: 4,
  })
}

async function getConfig() {
  const config = await prisma.config.findUnique({ where: { id: 1 } })
  return config?.descuentoTransferencia ?? 0
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

  const [relacionados, descuentoTransferencia] = await Promise.all([
    getRelacionados(producto.categoria.slug, producto.id),
    getConfig(),
  ])

  const precioFinal = calcularPrecioFinal(producto.precio, producto.descuento)
  const tieneDescuento = producto.descuento && producto.descuento > 0
  const tieneVariantes = producto.variantes.length > 0

  const stockTotal = tieneVariantes
    ? producto.variantes.reduce((acc, v) => acc + v.stock, 0)
    : producto.stock

  // Precio de transferencia
  const precioTransferencia = descuentoTransferencia > 0
    ? Math.round(precioFinal * (1 - descuentoTransferencia / 100))
    : null

  // Link del breadcrumb: categoría + marca (se codifica solo)
  const marcaHref = producto.marca
    ? `/productos?${new URLSearchParams({
        categoria: producto.categoria.slug,
        marca: producto.marca.slug,
      }).toString()}`
    : null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="font-mono text-xs text-muted mb-8 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
        <ChevronRight size={12} />
        <Link href="/productos" className="hover:text-primary transition-colors">Productos</Link>
        <ChevronRight size={12} />
        <Link href={`/productos?categoria=${producto.categoria.slug}`} className="hover:text-primary transition-colors">
          {producto.categoria.nombre}
        </Link>
        {producto.marca && marcaHref && (
          <>
            <ChevronRight size={12} />
            <Link href={marcaHref} className="hover:text-primary transition-colors">
              {producto.marca.nombre}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-text">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
        {/* Galería */}
        <Gallery imagenes={producto.imagenes} nombre={producto.nombre} />

        {/* Info */}
        <div className="space-y-6">
          {/* Categoría label */}
          <span className="card-label">{producto.categoria.nombre}</span>

          {/* Marca */}
          {producto.marca && (
            <p className="font-mono text-xs text-primary font-bold uppercase tracking-wider mt-3">
              {producto.marca.nombre}
            </p>
          )}

          {/* Nombre */}
          <h1 className="font-heading text-4xl font-bold uppercase leading-tight">
            {producto.nombre}
          </h1>

          {/* SKU */}
          {producto.sku && (
            <p className="font-mono text-xs text-muted">SKU: {producto.sku}</p>
          )}

          {/* Precio */}
          <div>
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
            {precioTransferencia && (
              <p className="font-mono text-sm text-green-600 mt-1">
                ${precioTransferencia.toLocaleString('es-AR')} con transferencia
              </p>
            )}
          </div>

          {/* Stock */}
          <p className={`font-mono text-sm ${stockTotal > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {stockTotal > 0 ? `En stock (${stockTotal} disponibles)` : 'Sin stock'}
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
          <div className="border border-primary/20 p-4 space-y-2">
            <p className="flex items-center gap-2.5 font-mono text-xs text-muted">
              <Truck size={16} strokeWidth={2} className="text-primary flex-shrink-0" />
              Envíos a todo el país — se coordina por WhatsApp
            </p>
            <p className="flex items-center gap-2.5 font-mono text-xs text-muted">
              <CreditCard size={16} strokeWidth={2} className="text-primary flex-shrink-0" />
              {descuentoTransferencia > 0
                ? `${descuentoTransferencia}% de descuento por transferencia bancaria`
                : 'Descuento por transferencia bancaria'}
            </p>
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
              <ProductCard
                key={p.id}
                producto={p}
                descuentoTransferencia={descuentoTransferencia}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
