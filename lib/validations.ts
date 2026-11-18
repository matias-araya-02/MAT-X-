import { z } from 'zod'

// Item de pedido que envía el cliente (solo IDs y cantidad)
export const pedidoItemSchema = z.object({
  productoId: z.string().min(1),
  varianteId: z.string().min(1).optional(),
  cantidad: z.number().int().min(1).max(10),
})

// Body del POST /api/pedidos
export const pedidoSchema = z.object({
  items: z.array(pedidoItemSchema).min(1).max(20),
  nombreCliente: z.string().min(2).max(100).optional(),
  telefono: z.string().min(7).max(20).optional(),
  notas: z.string().max(500).optional(),
})

export type PedidoItem = z.infer<typeof pedidoItemSchema>
export type PedidoInput = z.infer<typeof pedidoSchema>
