import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/productos — lista pública de productos activos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriaSlug = searchParams.get('categoria')

    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        ...(categoriaSlug
          ? { categoria: { slug: categoriaSlug } }
          : {}),
      },
      include: {
        imagenes: { orderBy: { orden: 'asc' }, take: 1 },
        categoria: { select: { nombre: true, slug: true } },
        variantes: { select: { id: true, nombre: true, precio: true, stock: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('[GET /api/productos]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
