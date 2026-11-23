import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { ProductCarousel } from '@/components/product/ProductCarousel'

interface Categoria {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagenUrl: string | null
  imagenEscala: number
}

interface Props {
  categorias: Categoria[]
}

// Hasta esta cantidad se muestra la grilla; con más, pasa a carrusel
const MAX_SIN_CARRUSEL = 4

function CategoriaCard({ cat }: { cat: Categoria }) {
  return (
    <Link
      href={`/productos?categoria=${cat.slug}`}
      className="product-card group block h-full w-full bg-white"
    >
      <div className="card-label">{cat.nombre}</div>

      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        {/* Difuminados morados */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-primary/25 blur-3xl transition-transform duration-500 group-hover:scale-125"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl transition-transform duration-500 group-hover:scale-125"
        />

        {cat.imagenUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative transition-transform duration-500 group-hover:scale-105"
              style={{ width: `${cat.imagenEscala}%`, height: `${cat.imagenEscala}%` }}
            >
              <Image
                src={cat.imagenUrl}
                alt=""
                fill
                unoptimized={cat.imagenUrl.endsWith('.svg')}
                sizes="(min-width: 1280px) 300px, (min-width: 768px) 25vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary/40">
            <Package size={48} strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
      </div>

      {cat.descripcion && (
        <p className="px-4 py-3 text-center font-mono text-xs text-secondary">
          {cat.descripcion}
        </p>
      )}
    </Link>
  )
}

export function CategoryGrid({ categorias }: Props) {
  if (categorias.length === 0) return null

  const conCarrusel = categorias.length > MAX_SIN_CARRUSEL

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <h2 className="mb-8 font-heading text-3xl font-bold uppercase md:text-4xl">
        Categorías
      </h2>

      {conCarrusel ? (
        <ProductCarousel label="Categorías">
          {categorias.map((cat) => (
            <CategoriaCard key={cat.id} cat={cat} />
          ))}
        </ProductCarousel>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categorias.map((cat) => (
            <CategoriaCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </section>
  )
}
