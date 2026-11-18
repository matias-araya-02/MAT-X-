import Image from 'next/image'
import Link from 'next/link'
import { calcularPrecioFinal } from '@/lib/pricing'
import type { Producto, Categoria, Imagen, Variante } from '@prisma/client'

type ProductoCard = Producto & {
  categoria: Pick<Categoria, 'nombre' | 'slug'>
  imagenes: Pick<Imagen, 'url' | 'alt'>[]
  variantes: Pick<Variante, 'id' | 'nombre' | 'precio' | 'stock'>[]
}

interface Props {
  producto: ProductoCard
}

export function ProductCard({ producto }: Props) {
  const imagen = producto.imagenes[0]
  const precioFinal = calcularPrecioFinal(producto.precio, producto.descuento)
  const tieneDescuento = producto.descuento && producto.descuento > 0

  // Stock: si tiene variantes suma el stock de todas; si no, usa el del producto
  const stockTotal = producto.variantes.length > 0
    ? producto.variantes.reduce((acc, v) => acc + v.stock, 0)
    : producto.stock
  const sinStock = stockTotal === 0

  return (
    <Link href={`/productos/${producto.slug}`} className="product-card group block">
      {/* Label etiqueta */}
      <div className="card-label">{producto.categoria.nombre}</div>

      {/* Imagen */}
      <div className="relative aspect-square bg-surface">
        {imagen ? (
          <Image
            src={imagen.url}
            alt={imagen.alt ?? producto.nombre}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-sm text-muted">
            Sin imagen
          </div>
        )}
        {tieneDescuento && (
          <span className="badge-discount absolute right-2 top-2">
            -{producto.descuento}%
          </span>
        )}
        {sinStock && (
          <span className="absolute left-2 top-2 bg-muted/80 text-white font-mono text-xs px-2 py-0.5">
            Sin stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="mb-1 font-heading text-lg font-bold leading-tight">
          {producto.nombre}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-sans text-xl font-bold text-text">
            ${precioFinal.toLocaleString('es-AR')}
          </span>
          {tieneDescuento && (
            <span className="font-mono text-sm text-muted line-through">
              ${producto.precio.toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
