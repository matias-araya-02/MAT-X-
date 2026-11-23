import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/home/Hero'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { BrandsCarousel } from '@/components/home/BrandsCarousel'
import { FeaturedBanners } from '@/components/home/FeaturedBanners'
import { ParallaxBanner } from '@/components/home/ParallaxBanner'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCarousel } from '@/components/product/ProductCarousel'
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
      marca: { select: { nombre: true, slug: true } },
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

async function getConfig() {
  const config = await prisma.config.findUnique({ where: { id: 1 } })
  return config?.descuentoTransferencia ?? 0
}

// Solo las marcas que tienen logo cargado
async function getMarcasConLogo() {
  const marcas = await prisma.marca.findMany({
    where: { logoUrl: { not: null } },
    select: { id: true, nombre: true, slug: true, logoUrl: true, logoEscala: true },
    orderBy: { nombre: 'asc' },
  })

  return marcas.flatMap((m) =>
    m.logoUrl
      ? [
          {
            id: m.id,
            nombre: m.nombre,
            slug: m.slug,
            logoUrl: m.logoUrl,
            logoEscala: m.logoEscala,
          },
        ]
      : []
  )
}

async function getDestacadosHome() {
  return prisma.destacadoHome.findMany({
    where: { producto: { activo: true } },
    select: {
      id: true,
      imagenUrl: true,
      producto: { select: { nombre: true, slug: true } },
    },
    orderBy: { orden: 'asc' },
  })
}

async function getCategorias() {
  return prisma.categoria.findMany({
    select: { id: true, nombre: true, slug: true, descripcion: true, imagenUrl: true, imagenEscala: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  })
}

async function getBannerParallax() {
  const b = await prisma.bannerParallax.findUnique({ where: { id: 1 } })
  if (!b || !b.activo || !b.imagenUrl) return null

  return {
    imagenUrl: b.imagenUrl,
    overlay: b.overlay,
    altura: b.altura,
    intensidad: b.intensidad,
    anchoCompleto: b.anchoCompleto,
    titulo: b.titulo,
    subtitulo: b.subtitulo,
    botonTexto: b.botonTexto,
    botonUrl: b.botonUrl,
  }
}

export default async function HomePage() {
  const [destacados, descuentoTransferencia, marcasConLogo, bannersHome, categorias, bannerParallax] =
    await Promise.all([
      getDestacados(),
      getConfig(),
      getMarcasConLogo(),
      getDestacadosHome(),
      getCategorias(),
      getBannerParallax(),
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
          <ProductCarousel label="Productos más vendidos">
            {destacados.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                descuentoTransferencia={descuentoTransferencia}
              />
            ))}
          </ProductCarousel>
        ) : (
          <p className="font-mono text-muted text-center py-12">
            No hay productos destacados todavía.
          </p>
        )}
      </section>

      <FeaturedBanners items={bannersHome} />

      <CategoryGrid categorias={categorias} />

      <ParallaxBanner banner={bannerParallax} />

      <BrandsCarousel marcas={marcasConLogo} />
    </div>
  )
}