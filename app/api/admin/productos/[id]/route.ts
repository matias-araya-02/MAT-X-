import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const VarianteSchema = z.object({
  id: z.string().optional(), // si tiene id, se actualiza; si no, se crea
  nombre: z.string().min(1),
  precio: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0),
})

const UpdateProductoSchema = z.object({
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Si es un toggle rápido (activo/destacado), manejar simple
  if (Object.keys(body).length <= 2 && ('activo' in body || 'destacado' in body)) {
    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(typeof body.activo === 'boolean' && { activo: body.activo }),
        ...(typeof body.destacado === 'boolean' && { destacado: body.destacado }),
      },
    })
    return NextResponse.json({ ok: true, activo: producto.activo, destacado: producto.destacado })
  }

  // Edición completa
  try {
    const parsed = UpdateProductoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { variantes, ...productoData } = parsed.data

    // Verificar slug único (excluyendo el producto actual)
    const existingSlug = await prisma.producto.findFirst({
      where: { slug: productoData.slug, NOT: { id } },
    })
    if (existingSlug) {
      return NextResponse.json({ error: 'Ya existe otro producto con ese slug' }, { status: 409 })
    }

    // Verificar que la marca exista (si se eligió una)
    if (productoData.marcaId) {
      const marca = await prisma.marca.findUnique({ where: { id: productoData.marcaId } })
      if (!marca) {
        return NextResponse.json({ error: 'La marca elegida no existe' }, { status: 400 })
      }
    }

    // Actualizar producto
    await prisma.producto.update({
      where: { id },
      data: {
        ...productoData,
        sku: productoData.sku || null,
        marcaId: productoData.marcaId || null,
        descripcion: productoData.descripcion || null,
        descuento: productoData.descuento || null,
      },
    })

    // Actualizar variantes: borrar las actuales y recrear
    if (variantes !== undefined) {
      await prisma.variante.deleteMany({ where: { productoId: id } })
      if (variantes.length > 0) {
        await prisma.variante.createMany({
          data: variantes.map((v) => ({
            nombre: v.nombre,
            precio: v.precio ?? null,
            stock: v.stock,
            productoId: id,
          })),
        })
      }
    }

    const productoFinal = await prisma.producto.findUnique({
      where: { id },
      include: { variantes: true, categoria: true },
    })

    return NextResponse.json({ ok: true, producto: productoFinal })
  } catch (error) {
    console.error('[PATCH /api/admin/productos/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { variantes: true, categoria: true, imagenes: true },
  })

  if (!producto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(producto)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.producto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
