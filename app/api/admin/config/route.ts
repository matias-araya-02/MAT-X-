import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET — obtener configuración actual
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Upsert: si no existe la fila id=1, la crea con valores por defecto
  const config = await prisma.config.upsert({
    where: { id: 1 },
    create: { id: 1, descuentoTransferencia: 0 },
    update: {},
  })

  return NextResponse.json(config)
}

// PATCH — actualizar configuración
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { descuentoTransferencia } = body

    if (
      descuentoTransferencia === undefined ||
      typeof descuentoTransferencia !== 'number' ||
      descuentoTransferencia < 0 ||
      descuentoTransferencia > 100
    ) {
      return NextResponse.json(
        { error: 'descuentoTransferencia debe ser un número entre 0 y 100' },
        { status: 400 }
      )
    }

    const config = await prisma.config.upsert({
      where: { id: 1 },
      create: { id: 1, descuentoTransferencia: Math.round(descuentoTransferencia) },
      update: { descuentoTransferencia: Math.round(descuentoTransferencia) },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('[PATCH /api/admin/config]', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
