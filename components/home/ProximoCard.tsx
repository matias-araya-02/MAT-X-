import Image from 'next/image'
import { CalendarDays } from 'lucide-react'

export interface ProximoData {
  id: string
  nombre: string
  categoria: string | null
  marca: string | null
  llegada: string | null
  precioEstimado: number | null
  imagenUrl: string
}

interface Props {
  item: ProximoData
  /** Link de WhatsApp para pedir que avisen (null si no hay número configurado) */
  href: string | null
}

// Misma estructura que ProductCard, pero sin carrito: el botón consulta por WhatsApp
export function ProximoCard({ item, href }: Props) {
  return (
    <div className="product-card flex h-full w-full flex-col bg-white">
      {item.categoria && <div className="card-label">{item.categoria}</div>}

      <div className="relative aspect-square bg-white">
        <Image
          src={item.imagenUrl}
          alt={item.nombre}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>

      <div className="flex flex-col gap-3 px-4">
        {item.marca && (
          <p className="font-mono text-[13px] font-bold uppercase leading-none tracking-wider text-primary">
            {item.marca}
          </p>
        )}

        <h3 className="font-heading text-base font-bold leading-tight">{item.nombre}</h3>

        {item.precioEstimado ? (
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-2xl font-bold leading-none text-text">
              ${item.precioEstimado.toLocaleString('es-AR')}
            </span>
            <span className="font-mono text-sm leading-none text-muted">estimado</span>
          </div>
        ) : null}

        {item.llegada && (
          <p className="flex items-center gap-1.5 font-mono text-[15px] leading-snug text-primary">
            <CalendarDays size={16} aria-hidden="true" className="shrink-0" />
            Llegada: {item.llegada}
          </p>
        )}
      </div>

      <div className="mt-auto shrink-0 px-4 pb-4 pt-3">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-cart">
            Avisame cuando llegue
          </a>
        ) : (
          <span aria-disabled="true" className="btn-cart pointer-events-none opacity-60">
            Próximamente
          </span>
        )}
      </div>
    </div>
  )
}
