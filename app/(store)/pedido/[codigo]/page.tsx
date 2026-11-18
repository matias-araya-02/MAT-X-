import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ codigo: string }>
}

export const metadata: Metadata = {
  title: 'Resumen del Pedido — MAT-X',
  description: 'Detalle de tu consulta en MAT-X.',
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  CONSULTA:   { label: 'Consulta enviada',  color: 'text-blue-600 bg-blue-50' },
  CONFIRMADO: { label: 'Confirmado',        color: 'text-green-600 bg-green-50' },
  PAGADO:     { label: 'Pago recibido',     color: 'text-green-700 bg-green-100' },
  ENVIADO:    { label: 'En camino',         color: 'text-violet-600 bg-violet-50' },
  ENTREGADO:  { label: 'Entregado ✓',      color: 'text-gray-600 bg-gray-100' },
  CANCELADO:  { label: 'Cancelado',         color: 'text-red-600 bg-red-50' },
}

export default async function PedidoPage({ params }: Props) {
  const { codigo } = await params

  const pedido = await prisma.pedido.findUnique({ where: { codigo } })
  if (!pedido) notFound()

  const items = pedido.items as Array<{
    nombre: string
    variante?: string
    precio: number
    cantidad: number
    subtotal?: number
  }>

  const estado = ESTADO_LABELS[pedido.estado] ?? { label: pedido.estado, color: 'text-gray-500 bg-gray-100' }
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Encabezado */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">🎮</div>
        <h1 className="font-heading text-3xl font-bold uppercase mb-2">
          ¡Consulta enviada!
        </h1>
        <p className="font-mono text-muted">
          Te vamos a contactar por WhatsApp para confirmar el pedido.
        </p>
      </div>

      {/* Card del pedido */}
      <div className="bg-surface border border-primary/20 p-6 space-y-6">
        {/* Info básica */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-primary/10">
          <div>
            <p className="font-mono text-xs text-muted uppercase tracking-wider">Pedido</p>
            <p className="font-heading font-bold text-xl">#{pedido.numero}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-muted uppercase tracking-wider">Estado</p>
            <span className={`font-mono text-sm font-semibold px-3 py-1 rounded-full ${estado.color}`}>
              {estado.label}
            </span>
          </div>
          <div className="w-full">
            <p className="font-mono text-xs text-muted">Código: <span className="text-text">{pedido.codigo}</span></p>
            <p className="font-mono text-xs text-muted">
              Fecha: {new Date(pedido.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted mb-3">
            Productos consultados
          </h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-heading font-semibold text-sm">{item.nombre}</p>
                  {item.variante && (
                    <p className="font-mono text-xs text-muted">{item.variante}</p>
                  )}
                  <p className="font-mono text-xs text-muted">
                    {item.cantidad} × ${item.precio.toLocaleString('es-AR')}
                  </p>
                </div>
                <p className="font-mono font-bold text-sm whitespace-nowrap">
                  ${(item.subtotal ?? item.precio * item.cantidad).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-primary/10 pt-4 flex justify-between items-center">
          <span className="font-heading font-bold uppercase">Total</span>
          <span className="font-mono font-bold text-xl text-primary">
            ${pedido.total.toLocaleString('es-AR')}
          </span>
        </div>

        {/* Notas */}
        {pedido.notas && (
          <div className="bg-background p-3 font-mono text-sm text-muted">
            <span className="font-semibold">Notas:</span> {pedido.notas}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola! Quiero consultar sobre mi pedido #${pedido.numero} (código: ${pedido.codigo})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 text-center flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Escribir por WhatsApp
          </a>
        )}
        <Link href="/productos" className="btn-outline flex-1 text-center">
          Seguir comprando
        </Link>
      </div>

      <p className="font-mono text-xs text-muted text-center mt-6">
        Guardá este código: <strong>{pedido.codigo}</strong> — lo podés usar para hacer seguimiento.
      </p>
    </div>
  )
}
