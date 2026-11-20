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
  descuentoTransferencia?: number
}

export function ProductCard({ producto, descuentoTransferencia = 0 }: Props) {
  const imagen = producto.imagenes[0]
  const precioFinal = calcularPrecioFinal(producto.precio, producto.descuento)
  const tieneDescuento = producto.descuento && producto.descuento > 0

  // Precio de transferencia: se aplica sobre el precio final (ya con descuento de producto)
  const precioTransferencia = descuentoTransferencia > 0
    ? Math.round(precioFinal * (1 - descuentoTransferencia / 100))
    : null

  // Stock
  const stockTotal = producto.variantes.length > 0
    ? producto.variantes.reduce((acc, v) => acc + v.stock, 0)
    : producto.stock
  const sinStock = stockTotal === 0

  return (
    <Link
      href={`/productos/${producto.slug}`}
      className="product-card group block bg-white"
    >
      {/* Label etiqueta categoría */}
      <div className="card-label">{producto.categoria.nombre}</div>

      {/* Imagen */}
      <div className="relative aspect-square bg-white">
        {imagen ? (
          <Image
            src={imagen.url}
            alt={imagen.alt ?? producto.nombre}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface font-mono text-sm text-muted">
            Sin imagen
          </div>
        )}
        {tieneDescuento && (
          <span className="badge-discount absolute left-2 top-2">
            -{producto.descuento}%
          </span>
        )}
        {sinStock && (
          <span className="absolute right-2 top-2 bg-zinc-800/80 text-white font-mono text-xs px-2 py-0.5">
            Sin stock
          </span>
        )}
      </div>

      {/*
        Info: un único gap define la separación entre
        imagen → marca → nombre → precios.
        El pt-0 evita sumar espacio extra: la imagen ya tiene p-4 abajo (16px),
        igual al gap-4 de acá.
      */}
      <div className="flex flex-col gap-4 px-4 pb-4 pt-0">
        {/* Marca */}
        {producto.marca && (
          <p className="font-mono text-[13px] font-bold uppercase leading-none tracking-wider text-primary">
            {producto.marca}
          </p>
        )}

        {/* Nombre */}
        <h3 className="font-heading text-base font-bold leading-tight">
          {producto.nombre}
        </h3>

        {/* Precios (agrupados, con poco espacio interno) */}
        <div className="flex flex-col gap-1">
          {/* Precio principal + tachado */}
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-2xl font-bold leading-none text-text">
              ${precioFinal.toLocaleString('es-AR')}
            </span>
            {tieneDescuento && (
              <span className="font-mono text-base text-muted line-through">
                ${producto.precio.toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Precio transferencia */}
          {precioTransferencia && (
            <p className="font-mono text-sm text-green-600">
              ${precioTransferencia.toLocaleString('es-AR')} transferencia
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}