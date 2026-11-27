import type { Pedido, Config } from '@prisma/client'

interface WhatsAppOptions {
  pedido: Pedido
  config: Config | null
}

/**
 * Genera el link wa.me con el resumen del pedido.
 * El número se toma de la variable de entorno NEXT_PUBLIC_WHATSAPP_NUMBER.
 */
export function generarMensajeWhatsApp({ pedido, config }: WhatsAppOptions): string {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  const items = pedido.items as Array<{
    nombre: string
    variante?: string
    precio: number
    cantidad: number
  }>

  const lineasItems = items
    .map((item) => {
      const variante = item.variante ? ` (${item.variante})` : ''
      const subtotal = item.precio * item.cantidad
      return `• ${item.nombre}${variante} x${item.cantidad} — $${subtotal.toLocaleString('es-AR')}`
    })
    .join('\n')

  const descuentoTexto =
    config && config.descuentoTransferencia > 0
      ? `\n💳 Descuento por transferencia: ${config.descuentoTransferencia}% (a coordinar)`
      : ''

  const mensaje = [
    `🎮 *MAT-X — Pedido #${pedido.numero}*`,
    ``,
    `Hola! Quiero consultar por los siguientes productos:`,
    ``,
    lineasItems,
    ``,
    `💰 *Total: $${pedido.total.toLocaleString('es-AR')}*${descuentoTexto}`,
    ``,
    `📦 Envíos a todo el país, se coordina por WhatsApp.`,
    ``,
    `Código de pedido: \`${pedido.codigo}\``,
  ].join('\n')

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

/**
 * Link wa.me para pedir que avisen cuando llegue un producto de "Próximamente".
 * Devuelve null si no está configurado NEXT_PUBLIC_WHATSAPP_NUMBER.
 */
export function generarLinkAvisoWhatsApp(nombre: string, marca?: string | null): string | null {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!numero) return null

  const producto = marca ? `${marca} ${nombre}` : nombre
  const mensaje = `Hola! Quiero que me avisen cuando llegue: ${producto}. Gracias!`

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}
