import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Package, Bell, Gamepad2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard | Admin MAT-X' }

async function getStats() {
  const [totalPedidos, pedidosConsulta, totalProductos, ultimosPedidos] = await Promise.all([
    prisma.pedido.count(),
    prisma.pedido.count({ where: { estado: 'CONSULTA' } }),
    prisma.producto.count({ where: { activo: true } }),
    prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])
  return { totalPedidos, pedidosConsulta, totalProductos, ultimosPedidos }
}

const ESTADO_COLORS: Record<string, string> = {
  CONSULTA:   'text-blue-600 bg-blue-50',
  CONFIRMADO: 'text-green-600 bg-green-50',
  PAGADO:     'text-green-700 bg-green-100',
  ENVIADO:    'text-violet-600 bg-violet-50',
  ENTREGADO:  'text-gray-500 bg-gray-100',
  CANCELADO:  'text-red-500 bg-red-50',
}

export default async function AdminDashboardPage() {
  const { totalPedidos, pedidosConsulta, totalProductos, ultimosPedidos } = await getStats()

  const stats = [
    { label: 'Pedidos totales',   value: totalPedidos,    icon: Package,  href: '/admin/pedidos',   color: 'text-amber-600 bg-amber-50' },
    { label: 'Consultas nuevas',  value: pedidosConsulta, icon: Bell,     href: '/admin/pedidos',   color: 'text-orange-500 bg-orange-50' },
    { label: 'Productos activos', value: totalProductos,  icon: Gamepad2, href: '/admin/productos', color: 'text-violet-600 bg-violet-50' },
  ]

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-8">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="bg-surface border border-primary/20 p-5 hover:border-primary transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-lg ${s.color}`}>
                  <Icon size={22} strokeWidth={2} />
                </span>
                <span className="font-mono text-3xl font-bold text-primary">{s.value}</span>
              </div>
              <p className="font-mono text-xs text-muted uppercase tracking-wider">{s.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Últimos pedidos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg uppercase">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="font-mono text-xs text-primary hover:underline">
            Ver todos →
          </Link>
        </div>

        {ultimosPedidos.length === 0 ? (
          <p className="font-mono text-sm text-muted">No hay pedidos todavía.</p>
        ) : (
          <div className="bg-surface border border-primary/20 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">#</th>
                  <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Cliente</th>
                  <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Total</th>
                  <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Estado</th>
                  <th className="font-mono text-xs text-muted uppercase text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPedidos.map((p) => (
                  <tr key={p.id} className="border-b border-primary/10 hover:bg-background transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">#{p.numero}</td>
                    <td className="px-4 py-3 font-mono text-muted">{p.nombreCliente ?? '—'}</td>
                    <td className="px-4 py-3 font-mono font-bold">${p.total.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold px-2 py-1 rounded-full ${ESTADO_COLORS[p.estado] ?? ''}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {new Date(p.createdAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
