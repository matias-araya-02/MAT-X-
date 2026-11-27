import { ProductCarousel } from '@/components/product/ProductCarousel'
import { generarLinkAvisoWhatsApp } from '@/lib/whatsapp'
import { ProximoCard, type ProximoData } from './ProximoCard'
import { ProximamenteTeaser, type ProximamenteTeaserData } from './ProximamenteTeaser'

interface Props {
  items: ProximoData[]
  /** Card fija con video o imagen. Si es null, se muestran solo los productos. */
  teaser: ProximamenteTeaserData | null
}

export function Proximamente({ items, teaser }: Props) {
  // Sin productos activos la sección no se muestra
  if (items.length === 0) return null

  return (
    <section
      id="proximamente"
      aria-label="Próximamente"
      className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-16"
    >
      <h2 className="mb-8 font-heading text-3xl font-bold uppercase md:text-4xl">
        Próximamente
      </h2>

      <ProductCarousel
        label="Productos próximos a ingresar"
        lead={teaser ? <ProximamenteTeaser {...teaser} /> : undefined}
      >
        {items.map((item) => (
          <ProximoCard
            key={item.id}
            item={item}
            href={generarLinkAvisoWhatsApp(item.nombre, item.marca)}
          />
        ))}
      </ProductCarousel>
    </section>
  )
}
