import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { eliminarImagen } from '@/lib/cloudinary'
import { bannerParallaxSchema } from '@/lib/validations'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const parsed = bannerParallaxSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const data = parsed.data

    const anterior = await prisma.bannerParallax.findUnique({
      where: { id: 1 },
      select: { imagenPublicId: true },
    })

    const banner = await prisma.bannerParallax.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    })

    // Si la imagen cambió o se quitó, borra la anterior de Cloudinary (sin romper si falla)
    if (anterior?.imagenPublicId && anterior.imagenPublicId !== data.imagenPublicId) {
      await eliminarImagen(anterior.imagenPublicId).catch(() => {})
    }

    revalidatePath('/')
    return NextResponse.json(banner)
  } catch (error) {
    console.error('[PUT /api/admin/banner]', error)
    return NextResponse.json({ error: 'Error al guardar el banner' }, { status: 500 })
  }
}
