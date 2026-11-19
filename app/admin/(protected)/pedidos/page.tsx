import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { CambiarEstadoPedido } from '@/components/admin/CambiarEstadoPedido'
import { FileText } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

export const metadata: Metadata = { title: 'Pedidos | Admin MAT-X' }
export const dynamic = 'force-dynamic'

const ESTADOS = ['CONSULTA', 'CONFIRMADO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

const ESTADO_COLORS: Record<string, string> = {
  CONSULTA:   'text-blue-600 bg-blue-50',
  CONFIRMADO: 'text-green-600 bg-green-50',
  PAGADO:     'text-green-700 bg-green-100',
  ENVIADO:    'text-violet-600 bg-violet-50',
  ENTREGADO:  'text-gray-500 bg-gray-100',
  CANCELADO:  'text-red-500 bg-red-50',
}

interface Props {
  searchParams: Promise<{ estado?: string }>
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const { estado } = await searchParams

  const pedidos = await prisma.pedido.findMany({
    where: estado ? { estado: estado as never } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">Pedidos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href="/admin/pedidos"
          className={`font-mono text-xs px-3 py-1 border transition-colors ${
            !estado ? 'bg-primary text-white border-primary' : 'border-primary/30 text-muted hover:border-primary'
          }`}
        >
          Todos ({await prisma.pedido.count()})
        </a>
        {ESTADOS.map((e) => (
          <a
            key={e}
            href={`/admin/pedidos?estado=${e}`}
            className={`font-mono text-xs px-3 py-1 border transition-colors ${
              estado === e ? 'bg-primary text-white border-primary' : 'border-primary/30 text-muted hover:border-primary'
            }`}
          >
            {e}
          </a>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <p className="font-mono text-sm text-muted">No hay pedidos con ese filtro.</p>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const items = pedido.items as Array<{
              nombre: string; variante?: string; precio: number; cantidad: number
            }>
            return (
              <div key={pedido.id} className="bg-surface border border-primary/20 p-4">
                {/* Header del pedido */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-heading font-bold text-lg">#{pedido.numero}</span>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${ESTADO_COLORS[pedido.estado]}`}>
                        {pedido.estado}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted">
                      {new Date(pedido.createdAt).toLocaleString('es-AR')}
                      {pedido.nombreCliente && ` · ${pedido.nombreCliente}`}
                      {pedido.telefono && ` · ${pedido.telefono}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-xl text-primary">
                      ${pedido.total.toLocaleString('es-AR')}
                    </p>
                    <p className="font-mono text-xs text-muted">cod: {pedido.codigo.slice(0, 8)}…</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between font-mono text-xs">
                      <span className="text-muted">
                        {item.cantidad}× {item.nombre}{item.variante ? ` (${item.variante})` : ''}
                      </span>
                      <span className="font-bold">
                        ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notas */}
                {pedido.notas && (
                  <p className="flex items-start gap-2 font-mono text-xs text-muted bg-background px-3 py-2 mb-4">
                    <FileText size={14} className="flex-shrink-0 mt-0.5" />
                    {pedido.notas}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 items-center">
                  <CambiarEstadoPedido pedidoId={pedido.id} estadoActual={pedido.estado} />
                  {pedido.telefono && (
                    <a
                      href={`https://wa.me/${pedido.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 border border-green-400 text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <WhatsAppIcon size={14} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
