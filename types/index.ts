// Tipos globales del proyecto MAT-X
// Los tipos de Prisma se importan directamente desde @prisma/client

import type { Producto, Categoria, Marca, Variante, Imagen, Pedido, Config } from '@prisma/client'

// ─── Producto con relaciones ────────────────────────────────────────────────

export type ProductoConRelaciones = Producto & {
  categoria: Pick<Categoria, 'nombre' | 'slug'>
  marca: Pick<Marca, 'nombre' | 'slug'> | null
  imagenes: Imagen[]
  variantes: Variante[]
}

export type ProductoCard = Producto & {
  categoria: Pick<Categoria, 'nombre' | 'slug'>
  marca: Pick<Marca, 'nombre' | 'slug'> | null
  imagenes: Pick<Imagen, 'url' | 'alt'>[]
  variantes: Pick<Variante, 'id' | 'nombre' | 'precio' | 'stock'>[]
}

// ─── Pedido ─────────────────────────────────────────────────────────────────

export type PedidoItem = {
  productoId: string
  varianteId?: string
  nombre: string
  variante?: string
  precio: number
  cantidad: number
  subtotal: number
}

// ─── Respuesta de la API de pedidos ─────────────────────────────────────────

export type CrearPedidoResponse = {
  pedidoCodigo: string
  pedidoNumero: number
  whatsappUrl: string
}

// ─── Estados del pedido ──────────────────────────────────────────────────────

export type EstadoPedido =
  | 'CONSULTA'
  | 'CONFIRMADO'
  | 'PAGADO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO'

export const ESTADOS_PEDIDO: Record<EstadoPedido, string> = {
  CONSULTA: 'Consulta',
  CONFIRMADO: 'Confirmado',
  PAGADO: 'Pagado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}
