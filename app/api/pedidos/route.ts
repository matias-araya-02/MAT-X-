import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pedidoSchema } from '@/lib/validations'
import { calcularTotal } from '@/lib/pricing'
import { generarMensajeWhatsApp } from '@/lib/whatsapp'
import { ratelimit } from '@/lib/ratelimit'

// POST /api/pedidos — crea la consulta y devuelve el link de WhatsApp
export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intentá de nuevo en un momento.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = pedidoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { items, nombreCliente, telefono, notas } = parsed.data

    // Obtener config (descuento transferencia)
    const config = await prisma.config.findUnique({ where: { id: 1 } })

    // Calcular total en el servidor (nunca confiar en el cliente)
    const { itemsConPrecio, total } = await calcularTotal(items)

    // Guardar pedido
    const pedido = await prisma.pedido.create({
      data: {
        items: itemsConPrecio as unknown as import('@prisma/client').Prisma.InputJsonValue,
        total,
        estado: 'CONSULTA',
        nombreCliente: nombreCliente ?? null,
        telefono: telefono ?? null,
        notas: notas ?? null,
      },
    })

    // Generar link de WhatsApp
    const waLink = generarMensajeWhatsApp({
      pedido,
      config,
    })

    return NextResponse.json({
      pedidoCodigo: pedido.codigo,
      pedidoNumero: pedido.numero,
      whatsappUrl: waLink,
    })
  } catch (error) {
    console.error('[POST /api/pedidos]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
