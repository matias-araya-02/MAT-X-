import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { eliminarImagen } from '@/lib/cloudinary'
import { categoriaSchema } from '@/lib/validations'

interface Ctx {
  params: Promise<{ id: string }>
}

function revalidar() {
  revalidatePath('/')
  revalidatePath('/productos')
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const parsed = categoriaSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const { nombre, slug, descripcion, imagenUrl, imagenPublicId, imagenEscala, orden } = parsed.data

    const anterior = await prisma.categoria.findUnique({
      where: { id },
      select: { imagenPublicId: true },
    })
    if (!anterior) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        nombre,
        slug,
        descripcion: descripcion || null,
        imagenUrl: imagenUrl || null,
        imagenPublicId: imagenPublicId || null,
        imagenEscala,
        orden,
      },
    })

    // Si la imagen cambió o se quitó, borra la anterior de Cloudinary (sin romper si falla)
    if (anterior.imagenPublicId && anterior.imagenPublicId !== (imagenPublicId || null)) {
      await eliminarImagen(anterior.imagenPublicId).catch(() => {})
    }

    revalidar()
    return NextResponse.json(categoria)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Ya existe una categoría con ese slug' }, { status: 409 })
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
      }
    }
    console.error('[PATCH /api/admin/categorias/[id]]', error)
    return NextResponse.json({ error: 'Error al guardar la categoría' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params

    const categoria = await prisma.categoria.findUnique({
      where: { id },
      select: { imagenPublicId: true, _count: { select: { productos: true } } },
    })
    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const productos = categoria._count.productos
    if (productos > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: tiene ${productos} producto${productos === 1 ? '' : 's'}. Movelos a otra categoría primero.`,
        },
        { status: 409 }
      )
    }

    await prisma.categoria.delete({ where: { id } })

    if (categoria.imagenPublicId) {
      await eliminarImagen(categoria.imagenPublicId).catch(() => {})
    }

    revalidar()
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }
    console.error('[DELETE /api/admin/categorias/[id]]', error)
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 })
  }
}
