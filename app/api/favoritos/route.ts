import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_IDS = 100

// POST /api/favoritos  { ids: string[] } — productos activos para la lista de favoritos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const ids: unknown = body?.ids

    if (
      !Array.isArray(ids) ||
      ids.length > MAX_IDS ||
      !ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 64)
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const [productos, config] = await Promise.all([
      prisma.producto.findMany({
        where: { id: { in: ids as string[] }, activo: true },
        include: {
          categoria: { select: { nombre: true, slug: true } },
          marca: { select: { nombre: true, slug: true } },
          imagenes: { orderBy: { orden: 'asc' }, take: 1 },
          variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
        },
      }),
      prisma.config.findUnique({ where: { id: 1 } }),
    ])

    return NextResponse.json({
      productos,
      descuentoTransferencia: config?.descuentoTransferencia ?? 0,
    })
  } catch (error) {
    console.error('[POST /api/favoritos]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
