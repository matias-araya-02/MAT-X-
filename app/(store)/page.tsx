import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/home/Hero'
import type { HeroSlideData } from '@/components/home/HeroShowcase'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { BrandsCarousel } from '@/components/home/BrandsCarousel'
import { FeaturedBanners } from '@/components/home/FeaturedBanners'
import { ParallaxBanner } from '@/components/home/ParallaxBanner'
import { Proximamente } from '@/components/home/Proximamente'
import type { ProximoData } from '@/components/home/ProximoCard'
import type { ProximamenteTeaserData } from '@/components/home/ProximamenteTeaser'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCarousel } from '@/components/product/ProductCarousel'
import { calcularPrecioFinal } from '@/lib/pricing'
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

// Slides del hero: solo los activos, de productos activos
async function getHeroSlides() {
  return prisma.heroSlide.findMany({
    where: { activo: true, producto: { activo: true } },
    orderBy: { orden: 'asc' },
    select: {
      id: true,
      palabra: true,
      imagenUrl: true,
      producto: {
        select: {
          nombre: true,
          slug: true,
          precio: true,
          descuento: true,
          categoria: { select: { nombre: true } },
          marca: { select: { nombre: true } },
        },
      },
    },
  })
}

// Sección "Próximamente": productos que todavía no llegaron + card con video o imagen
async function getProximamente() {
  const [config, items] = await Promise.all([
    prisma.proximamenteConfig.findUnique({ where: { id: 1 } }),
    prisma.proximoIngreso.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        nombre: true,
        llegada: true,
        precioEstimado: true,
        imagenUrl: true,
        categoria: { select: { nombre: true } },
        marca: { select: { nombre: true } },
      },
    }),
  ])

  const proximos: ProximoData[] = items.map((it) => ({
    id: it.id,
    nombre: it.nombre,
    categoria: it.categoria?.nombre ?? null,
    marca: it.marca?.nombre ?? null,
    llegada: it.llegada,
    precioEstimado: it.precioEstimado,
    imagenUrl: it.imagenUrl,
  }))

  // La card fija se muestra si está activa y tiene video o imagen
  const teaser: ProximamenteTeaserData | null =
    config && config.activo && (config.videoUrl || config.imagenUrl)
      ? {
          videoUrl: config.videoUrl,
          imagenUrl: config.imagenUrl,
          titulo: config.titulo,
          subtitulo: config.subtitulo,
          enlaceUrl: config.enlaceUrl,
          enlaceTexto: config.enlaceTexto,
        }
      : null

  return { proximos, teaser }
}

export default async function HomePage() {
  const [
    destacados,
    descuentoTransferencia,
    marcasConLogo,
    bannersHome,
    categorias,
    bannerParallax,
    heroSlidesRaw,
    proximamente,
  ] = await Promise.all([
    getDestacados(),
    getConfig(),
    getMarcasConLogo(),
    getDestacadosHome(),
    getCategorias(),
    getBannerParallax(),
    getHeroSlides(),
    getProximamente(),
  ])

  // Datos listos para el hero (precios calculados en el servidor)
  const heroSlides: HeroSlideData[] = heroSlidesRaw.map((s) => {
    const { nombre, slug, precio, descuento, categoria, marca } = s.producto
    const precioFinal = calcularPrecioFinal(precio, descuento)

    return {
      id: s.id,
      nombre,
      slug,
      categoria: categoria.nombre,
      marca: marca?.nombre ?? null,
      imagenUrl: s.imagenUrl,
      // Palabra de fondo: la elegida, o el nombre si es corto, o la categoría
      palabra: (s.palabra?.trim() || (nombre.length <= 12 ? nombre : categoria.nombre)).toUpperCase(),
      precio,
      precioFinal,
      descuento: descuento ?? 0,
      precioTransferencia:
        descuentoTransferencia > 0
          ? Math.round(precioFinal * (1 - descuentoTransferencia / 100))
          : null,
    }
  })

  return (
    <div>
      <Hero slides={heroSlides} />

      <section id="mas-vendidos" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-16">
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

      <Proximamente items={proximamente.proximos} teaser={proximamente.teaser} />

      <ParallaxBanner banner={bannerParallax} />

      <BrandsCarousel marcas={marcasConLogo} />
    </div>
  )
}
