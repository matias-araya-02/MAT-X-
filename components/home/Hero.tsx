import Link from 'next/link'
import { HeroShowcase, type HeroSlideData } from './HeroShowcase'
import { ScrollLink } from './ScrollLink'

// Difuminado violeta que sube desde el borde inferior del hero.
// INTENSIDAD: de 0 a 1 (0 = sin difuminado). ALTURA: hasta dónde llega, en % del alto del hero.
const DIFUMINADO_INFERIOR_INTENSIDAD = 0.16
const DIFUMINADO_INFERIOR_ALTURA = 75

// Degradado original de la esquina superior derecha.
// 0 = desactivado (la parte de arriba queda blanca). El valor original era 0.12.
const ESQUINA_SUPERIOR_DERECHA_INTENSIDAD = 0

interface Props {
  slides?: HeroSlideData[]
}

export function Hero({ slides = [] }: Props) {
  const conSlides = slides.length > 0

  return (
    <section className="relative overflow-hidden lg:min-h-[calc(100svh-6rem)]">
      {/* Degradado violeta en la esquina superior derecha (desactivado por defecto) */}
      {ESQUINA_SUPERIOR_DERECHA_INTENSIDAD > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top right, rgba(124,58,237,${ESQUINA_SUPERIOR_DERECHA_INTENSIDAD}), transparent 60%)`,
          }}
        />
      )}

      {/* Difuminado violeta desde la parte inferior hacia arriba */}
      {DIFUMINADO_INFERIOR_INTENSIDAD > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(124,58,237,${DIFUMINADO_INFERIOR_INTENSIDAD}) 0%, rgba(124,58,237,${(
              DIFUMINADO_INFERIOR_INTENSIDAD * 0.4
            ).toFixed(3)}) 40%, transparent ${DIFUMINADO_INFERIOR_ALTURA}%)`,
          }}
        />
      )}

      <div className="container relative mx-auto px-4 py-14 md:pt-16 md:pb-24">
        <div
          className={
            conSlides
              ? 'grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-8'
              : ''
          }
        >
          <div>
            <p className="card-label mb-6 inline-block">Nuevos ingresos</p>

            {/* Con producto a la derecha el título se achica en pantallas medianas para que entre */}
            <h1
              className={`font-heading text-5xl font-bold uppercase leading-none ${conSlides
                ? 'md:text-8xl lg:text-6xl xl:text-7xl 2xl:text-8xl'
                : 'md:text-8xl'
                }`}
            >
              Subí el nivel
              <br />
              <span className="text-primary">de tu setup</span>
            </h1>

            <p className="mt-6 max-w-xl font-mono text-sm text-muted md:text-base">
              Teclados, auriculares, cables y controladoras para gamers.
              Pedí por WhatsApp y coordinamos el envío a todo el país.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/productos" className="btn-primary">
                Ver productos
              </Link>
              <ScrollLink href="#mas-vendidos" className="btn-outline">
                Más vendidos
              </ScrollLink>
            </div>
          </div>

          {conSlides && <HeroShowcase slides={slides} />}
        </div>
      </div>
    </section>
  )
}
