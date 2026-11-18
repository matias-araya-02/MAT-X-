import { prisma } from '@/lib/prisma'
import type { PedidoItem } from '@/lib/validations'

interface ItemConPrecio {
  productoId: string
  varianteId?: string
  nombre: string
  variante?: string
  precio: number
  cantidad: number
  subtotal: number
}

/**
 * Calcula el total del pedido SIEMPRE en el servidor.
 * Nunca confiar en los precios enviados por el cliente.
 * Lanza un error si algún producto no existe, está inactivo o no tiene stock.
 */
export async function calcularTotal(items: PedidoItem[]): Promise<{
  itemsConPrecio: ItemConPrecio[]
  total: number
}> {
  const itemsConPrecio: ItemConPrecio[] = []

  for (const item of items) {
    const producto = await prisma.producto.findUnique({
      where: { id: item.productoId },
      include: { variantes: true },
    })

    if (!producto || !producto.activo) {
      throw new Error(`Producto no disponible: ${item.productoId}`)
    }

    const tieneVariantes = producto.variantes.length > 0

    if (tieneVariantes) {
      if (!item.varianteId) {
        throw new Error(`Se requiere variante para: ${producto.nombre}`)
      }
      const variante = producto.variantes.find((v) => v.id === item.varianteId)
      if (!variante) {
        throw new Error(`Variante no encontrada: ${item.varianteId}`)
      }
      if (variante.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para: ${producto.nombre} — ${variante.nombre}`)
      }

      // La variante puede tener precio propio o heredar el del producto
      const precioBase = variante.precio ?? producto.precio
      // Aplicar descuento si existe
      const descuento = producto.descuento ?? 0
      const precioFinal = Math.round(precioBase * (1 - descuento / 100))

      itemsConPrecio.push({
        productoId: producto.id,
        varianteId: variante.id,
        nombre: producto.nombre,
        variante: variante.nombre,
        precio: precioFinal,
        cantidad: item.cantidad,
        subtotal: precioFinal * item.cantidad,
      })
    } else {
      // Producto sin variantes: usar stock propio
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para: ${producto.nombre}`)
      }
      const descuento = producto.descuento ?? 0
      const precioFinal = Math.round(producto.precio * (1 - descuento / 100))

      itemsConPrecio.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: precioFinal,
        cantidad: item.cantidad,
        subtotal: precioFinal * item.cantidad,
      })
    }
  }

  const total = itemsConPrecio.reduce((acc, item) => acc + item.subtotal, 0)

  return { itemsConPrecio, total }
}

/**
 * Calcula el precio final de un producto (con descuento aplicado).
 */
export function calcularPrecioFinal(precio: number, descuento?: number | null): number {
  if (!descuento || descuento <= 0) return precio
  return Math.round(precio * (1 - descuento / 100))
}
