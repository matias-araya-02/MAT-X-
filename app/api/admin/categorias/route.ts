import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { categoriaSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const parsed = categoriaSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const { nombre, slug, descripcion, imagenUrl, imagenPublicId, imagenEscala, orden } = parsed.data

    const categoria = await prisma.categoria.create({
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

    revalidatePath('/')
    revalidatePath('/productos')
    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese slug' }, { status: 409 })
    }
    console.error('[POST /api/admin/categorias]', error)
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 })
  }
}
