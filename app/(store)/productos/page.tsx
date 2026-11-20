import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/product/ProductCard'
import { FiltrosSidebar } from '@/components/product/FiltrosSidebar'
import { OrdenSelect } from '@/components/product/OrdenSelect'
import { calcularPrecioFinal } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Explorá todo nuestro catálogo de periféricos gaming.',
}

async function getCategorias() {
  return prisma.categoria.findMany({ orderBy: { orden: 'asc' } })
}

async function getProductos() {
  return prisma.producto.findMany({
    where: { activo: true },
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
  searchParams: Promise<{
    categoria?: string
    marca?: string
    min?: string
    max?: string
    orden?: string
  }>
}

const toList = (v?: string) => (v ? v.split(',').filter(Boolean) : [])

const toInt = (v?: string) => {
  const n = parseInt(v ?? '', 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

// Normaliza una marca para compararla: sin espacios sobrantes ni mayúsculas
const normMarca = (m: string) => m.trim().replace(/\s+/g, ' ').toLowerCase()

export default async function ProductosPage({ searchParams }: Props) {
  const sp = await searchParams
  const categoriasSel = toList(sp.categoria)
  const marcasSel = toList(sp.marca).map(normMarca)
  const min = toInt(sp.min)
  const max = toInt(sp.max)
  const orden = sp.orden ?? 'recientes'

  const [categorias, todos, descuentoTransferencia] = await Promise.all([
    getCategorias(),
    getProductos(),
    getConfig(),
  ])

  // Precio final (con descuento del producto) de cada uno
  const conPrecio = todos.map((p) => ({
    producto: p,
    precioFinal: calcularPrecioFinal(p.precio, p.descuento),
  }))

  // Opciones del panel (calculadas sobre todo el catálogo activo)
  const categoriasFacet = categorias.map((c) => ({
    nombre: c.nombre,
    slug: c.slug,
    count: todos.filter((p) => p.categoria.slug === c.slug).length,
  }))

  // Marcas agrupadas sin importar mayúsculas/espacios.
  // Para mostrar se usa la variante escrita más veces.
  const marcasAgrupadas = new Map<string, { count: number; variantes: Map<string, number> }>()
  for (const p of todos) {
    if (!p.marca) continue
    const limpia = p.marca.trim().replace(/\s+/g, ' ')
    if (!limpia) continue
    const clave = normMarca(limpia)
    const grupo = marcasAgrupadas.get(clave) ?? { count: 0, variantes: new Map() }
    grupo.count += 1
    grupo.variantes.set(limpia, (grupo.variantes.get(limpia) ?? 0) + 1)
    marcasAgrupadas.set(clave, grupo)
  }

  const marcasFacet = [...marcasAgrupadas.values()]
    .map((g) => ({
      nombre: [...g.variantes.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: g.count,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const precios = conPrecio.map((x) => x.precioFinal)
  const precioMin = precios.length ? Math.min(...precios) : 0
  const precioMax = precios.length ? Math.max(...precios) : 0

  // Filtrado
  const filtrados = conPrecio.filter(({ producto, precioFinal }) => {
    if (categoriasSel.length && !categoriasSel.includes(producto.categoria.slug)) return false
    if (
      marcasSel.length &&
      (!producto.marca || !marcasSel.includes(normMarca(producto.marca)))
    )
      return false
    if (min !== undefined && precioFinal < min) return false
    if (max !== undefined && precioFinal > max) return false
    return true
  })

  // Orden (por defecto ya viene por createdAt desc)
  if (orden === 'precio-asc') filtrados.sort((a, b) => a.precioFinal - b.precioFinal)
  if (orden === 'precio-desc') filtrados.sort((a, b) => b.precioFinal - a.precioFinal)

  const productos = filtrados.map((x) => x.producto)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <FiltrosSidebar
          categorias={categoriasFacet}
          marcas={marcasFacet}
          precioMin={precioMin}
          precioMax={precioMax}
        />

        <div className="min-w-0 flex-1">
          {/* Contador + orden */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              <span className="font-bold text-text">{productos.length}</span>{' '}
              producto{productos.length !== 1 ? 's' : ''}
            </p>
            <OrdenSelect valor={orden} />
          </div>

          {/* Grid */}
          {productos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
              <p className="font-mono text-muted">
                No hay productos que coincidan con los filtros.
              </p>
              <Link href="/productos" className="btn-primary mt-6 inline-block">
                Limpiar filtros
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}