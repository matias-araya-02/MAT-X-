import Image from 'next/image'
import Link from 'next/link'
import { calcularPrecioFinal } from '@/lib/pricing'
import type { Producto, Categoria, Marca, Imagen, Variante } from '@prisma/client'
import { CardAddToCartButton } from './CardAddToCartButton'
import { FavoritoButton } from './FavoritoButton'

type ProductoCard = Producto & {
  categoria: Pick<Categoria, 'nombre' | 'slug'>
  marca: Pick<Marca, 'nombre' | 'slug'> | null
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
    <div className="product-card group relative flex h-full w-full flex-col bg-white">
      <Link
        href={`/productos/${producto.slug}`}
        className="flex flex-none flex-col"
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
            <span className="absolute bottom-2 left-2 bg-zinc-800/80 text-white font-mono text-xs px-2 py-0.5">
              Sin stock
            </span>
          )}
        </div>

        {/* Info: un único gap define la separación entre marca → nombre → precio → transferencia */}
        <div className="flex flex-col gap-3 px-4 pb-0 pt-0">
          {/* Marca */}
          {producto.marca && (
            <p className="font-mono text-[13px] font-bold uppercase leading-none tracking-wider text-primary">
              {producto.marca.nombre}
            </p>
          )}

          {/* Nombre */}
          <h3 className="font-heading text-base font-bold leading-tight">
            {producto.nombre}
          </h3>

          {/* Precio principal + tachado */}
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-2xl font-bold leading-none text-text">
              ${precioFinal.toLocaleString('es-AR')}
            </span>
            {tieneDescuento && (
              <span className="font-mono text-base leading-none text-muted line-through">
                ${producto.precio.toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Precio transferencia */}
          {precioTransferencia && (
            <p className="font-mono text-[15px] leading-snug text-green-600">
              ${precioTransferencia.toLocaleString('es-AR')} con transferencia
            </p>
          )}
        </div>
      </Link>

      {/* Favorito: fuera del Link para que no navegue. top-8 = debajo de la etiqueta (24px) + 8px */}
      <div className="absolute right-2 top-8 z-10">
        <FavoritoButton productoId={producto.id} nombre={producto.nombre} />
      </div>

      {/* Botón: mismo gap que el resto (pt-3), pegado abajo */}
      <div className="mt-auto shrink-0 px-4 pb-4 pt-[17px]">
        {producto.variantes.length > 0 && !sinStock ? (
          <Link href={`/productos/${producto.slug}`} className="btn-cart">
            Elegir opciones
          </Link>
        ) : (
          <CardAddToCartButton
            productoId={producto.id}
            nombre={producto.nombre}
            precio={precioFinal}
            imagen={imagen?.url}
            stock={stockTotal}
          />
        )}
      </div>
    </div>
  )
}
