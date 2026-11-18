// Barra de anuncios con marquee animado
export function AnnouncementBar() {
  const mensajes = [
    '🚀 Envíos a todo el país — se coordina por WhatsApp',
    '🎮 Periféricos gaming de alto rendimiento',
    '💳 Descuento por transferencia bancaria',
    '🛡️ Garantía oficial en todos los productos',
    '⚡ Cables coiled, teclados mecánicos, auriculares y más',
  ]

  const contenido = [...mensajes, ...mensajes].join('   ·   ')

  return (
    <div className="bg-primary text-white overflow-hidden py-2">
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="font-mono text-xs font-bold uppercase tracking-wider">
          {contenido}
        </span>
      </div>
    </div>
  )
}
