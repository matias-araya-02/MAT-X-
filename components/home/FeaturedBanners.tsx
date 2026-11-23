import Image from 'next/image'
import Link from 'next/link'

interface Item {
  id: string
  imagenUrl: string
  producto: { nombre: string; slug: string }
}

interface Props {
  items: Item[]
}

export function FeaturedBanners({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section
      aria-label="Productos destacados"
      className="mx-auto w-full max-w-7xl px-4 py-16"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/productos/${item.producto.slug}`}
            aria-label={`Ver ${item.producto.nombre}`}
            className="group relative block aspect-[4/5] overflow-hidden bg-zinc-900 md:aspect-[3/4]"
          >
            <Image
              src={item.imagenUrl}
              alt={item.producto.nombre}
              fill
              sizes="(min-width: 1280px) 416px, (min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}