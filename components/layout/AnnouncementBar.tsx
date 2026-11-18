// Barra de anuncios con marquee animado
export function AnnouncementBar() {
  const mensajes = [
    '10% OFF con transferencia',
    'Productos 100% originales',
    'Entregas en Mendoza',
  ]

  // Se repite la lista para que el marquee no tenga huecos (cantidad par)
  const items = [...mensajes, ...mensajes, ...mensajes, ...mensajes]

  return (
    <div className="bg-primary text-white overflow-hidden py-2">
      <div className="flex whitespace-nowrap animate-marquee">
        <div className="flex items-center font-mono text-xs font-bold uppercase tracking-wider">
          {items.map((texto, i) => (
            <span key={i} className="flex items-center">
              {texto}
              <span className="mx-6 inline-block h-1.5 w-1.5 bg-white" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}