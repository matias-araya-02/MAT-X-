import Image from 'next/image'
import Link from 'next/link'

interface MarcaLogo {
  id: string
  nombre: string
  slug: string
  logoUrl: string
}

interface Props {
  marcas: MarcaLogo[]
}

// Cantidad mínima de logos por "mitad" del carril, para que siempre llene el ancho
const MIN_ITEMS = 8

export function BrandsCarousel({ marcas }: Props) {
  if (marcas.length === 0) return null

  // Repite la lista hasta llegar al mínimo
  const repeticiones = Math.ceil(MIN_ITEMS / marcas.length)
  const base = Array.from({ length: repeticiones }, () => marcas).flat()

  // ~5s por logo: velocidad pareja sin importar cuántas marcas haya
  const duracion = Math.max(20, base.length * 5)

  // El carril tiene dos mitades idénticas; el marquee se desplaza -50% y vuelve a empezar
  const renderMitad = (duplicada: boolean) => (
    <ul aria-hidden={duplicada || undefined} className="flex shrink-0 items-center">
      {base.map((m, i) => (
        <li key={`${m.id}-${i}`} className="px-10">
          <Link
            href={`/productos?marca=${m.slug}`}
            tabIndex={duplicada ? -1 : undefined}
            aria-label={duplicada ? undefined : `Ver productos de ${m.nombre}`}
            className="group relative block h-24 w-64"
          >
            <Image
              src={m.logoUrl}
              alt={duplicada ? '' : m.nombre}
              fill
              sizes="256px"
              className="object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
            />
          </Link>
        </li>
      ))}
    </ul>
  )

  const difuminado =
    'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16">
      <h2 className="mb-8 font-heading text-3xl font-bold uppercase md:text-4xl">
        Marcas
      </h2>

      <div
        className="overflow-hidden"
        style={{ maskImage: difuminado, WebkitMaskImage: difuminado }}
      >
        <div
          className="flex w-max animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duracion}s` }}
        >
          {renderMitad(false)}
          {renderMitad(true)}
        </div>
      </div>
    </section>
  )
}
