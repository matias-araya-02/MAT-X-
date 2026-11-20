import { Truck, CreditCard, BadgeCheck } from 'lucide-react'

const MENSAJES = [
  { texto: 'Entregas en Mendoza', icon: Truck },
  { texto: '10% OFF con transferencia', icon: CreditCard },
  { texto: 'Productos 100% originales', icon: BadgeCheck },
]

export function AnnouncementBar() {
  // Se repite la lista para que el marquee no tenga huecos
  const items = [...MENSAJES, ...MENSAJES, ...MENSAJES, ...MENSAJES]

  return (
    <div className="bg-primary text-white overflow-hidden py-2">
      <div className="flex whitespace-nowrap animate-marquee">
        <div className="flex items-center font-mono text-xs font-bold uppercase tracking-wider">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <span key={i} className="flex items-center">
                <Icon size={13} strokeWidth={2.5} className="mr-1.5" />
                {item.texto}
                <span className="mx-6 inline-block h-1 w-1 bg-white" aria-hidden="true" />
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
