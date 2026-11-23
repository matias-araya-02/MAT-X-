import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const VarianteSchema = z.object({
  nombre: z.string().min(1),
  precio: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0),
})

const ProductoSchema = z.object({
  nombre: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  marcaId: z.string().optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  descripcion: z.string().max(2000).optional().nullable(),
  precio: z.number().int().positive(),
  descuento: z.number().int().min(0).max(100).optional().nullable(),
  stock: z.number().int().min(0),
  activo: z.boolean(),
  destacado: z.boolean(),
  categoriaId: z.string().min(1),
  variantes: z.array(VarianteSchema).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = ProductoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { variantes, ...productoData } = parsed.data

    // Verificar slug único
    const existingSlug = await prisma.producto.findUnique({ where: { slug: productoData.slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Ya existe un producto con ese slug' }, { status: 409 })
    }

    // Verificar SKU único si se proporcionó
    if (productoData.sku) {
      const existingSku = await prisma.producto.findUnique({ where: { sku: productoData.sku } })
      if (existingSku) {
        return NextResponse.json({ error: 'Ya existe un producto con ese SKU' }, { status: 409 })
      }
    }

    // Verificar que la marca exista (si se eligió una)
    if (productoData.marcaId) {
      const marca = await prisma.marca.findUnique({ where: { id: productoData.marcaId } })
      if (!marca) {
        return NextResponse.json({ error: 'La marca elegida no existe' }, { status: 400 })
      }
    }

    const producto = await prisma.producto.create({
      data: {
        ...productoData,
        sku: productoData.sku || null,
        marcaId: productoData.marcaId || null,
        descripcion: productoData.descripcion || null,
        descuento: productoData.descuento || null,
        variantes: variantes && variantes.length > 0
          ? { create: variantes }
          : undefined,
      },
      include: { variantes: true, categoria: true },
    })

    return NextResponse.json({ ok: true, producto })
  } catch (error) {
    console.error('[POST /api/admin/productos]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
