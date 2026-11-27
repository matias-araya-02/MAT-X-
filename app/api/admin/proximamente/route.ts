import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { eliminarImagen } from '@/lib/cloudinary'
import { z } from 'zod'

const MAX_ITEMS = 12

const imagenCloudinary = z
  .string()
  .trim()
  .max(500)
  .refine((u) => u.startsWith('https://res.cloudinary.com/'), 'Imagen inválida')

const enlaceValido = (u: string) =>
  (u.startsWith('/') && !u.startsWith('//')) || /^https?:\/\//i.test(u)

const ConfigSchema = z.object({
  activo: z.boolean(),
  titulo: z.string().trim().max(80, 'El título es demasiado largo').nullable().optional(),
  subtitulo: z.string().trim().max(160, 'El subtítulo es demasiado largo').nullable().optional(),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((u) => /^https:\/\//i.test(u), 'La URL del video debe empezar con https://')
    .nullable()
    .optional(),
  imagenUrl: imagenCloudinary.nullable().optional(),
  imagenPublicId: z.string().trim().max(300).nullable().optional(),
  enlaceTexto: z.string().trim().max(40, 'El texto del enlace es demasiado largo').nullable().optional(),
  enlaceUrl: z
    .string()
    .trim()
    .max(300)
    .refine(enlaceValido, 'El enlace debe empezar con / o con https://')
    .nullable()
    .optional(),
})

const ItemSchema = z.object({
  nombre: z.string().trim().min(1, 'Falta el nombre de un producto').max(120, 'Un nombre es demasiado largo'),
  categoriaId: z.string().trim().min(1).nullable().optional(),
  marcaId: z.string().trim().min(1).nullable().optional(),
  llegada: z.string().trim().max(60, 'El texto de llegada es demasiado largo').nullable().optional(),
  precioEstimado: z.number().int().positive().max(100_000_000).nullable().optional(),
  activo: z.boolean(),
  imagenUrl: imagenCloudinary,
  imagenPublicId: z.string().trim().min(1).max(300),
})

const BodySchema = z.object({
  config: ConfigSchema,
  items: z.array(ItemSchema).max(MAX_ITEMS, `Máximo ${MAX_ITEMS} productos`),
})

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const { config, items } = parsed.data

    // Las categorías y marcas elegidas tienen que existir
    const categoriaIds = [...new Set(items.flatMap((i) => (i.categoriaId ? [i.categoriaId] : [])))]
    if (categoriaIds.length > 0) {
      const existentes = await prisma.categoria.findMany({
        where: { id: { in: categoriaIds } },
        select: { id: true },
      })
      if (existentes.length !== categoriaIds.length) {
        return NextResponse.json({ error: 'Una de las categorías elegidas ya no existe' }, { status: 400 })
      }
    }

    const marcaIds = [...new Set(items.flatMap((i) => (i.marcaId ? [i.marcaId] : [])))]
    if (marcaIds.length > 0) {
      const existentes = await prisma.marca.findMany({
        where: { id: { in: marcaIds } },
        select: { id: true },
      })
      if (existentes.length !== marcaIds.length) {
        return NextResponse.json({ error: 'Una de las marcas elegidas ya no existe' }, { status: 400 })
      }
    }

    const cfg = {
      activo: config.activo,
      titulo: config.titulo?.trim() || null,
      subtitulo: config.subtitulo?.trim() || null,
      videoUrl: config.videoUrl?.trim() || null,
      imagenUrl: config.imagenUrl ?? null,
      imagenPublicId: config.imagenUrl ? (config.imagenPublicId ?? null) : null,
      enlaceTexto: config.enlaceTexto?.trim() || null,
      enlaceUrl: config.enlaceUrl?.trim() || null,
    }

    const [configAnterior, itemsAnteriores] = await Promise.all([
      prisma.proximamenteConfig.findUnique({ where: { id: 1 }, select: { imagenPublicId: true } }),
      prisma.proximoIngreso.findMany({ select: { imagenPublicId: true } }),
    ])

    await prisma.$transaction([
      prisma.proximamenteConfig.upsert({
        where: { id: 1 },
        create: { id: 1, ...cfg },
        update: cfg,
      }),
      prisma.proximoIngreso.deleteMany(),
      prisma.proximoIngreso.createMany({
        data: items.map((it, i) => ({
          orden: i,
          activo: it.activo,
          nombre: it.nombre,
          categoriaId: it.categoriaId || null,
          marcaId: it.marcaId || null,
          llegada: it.llegada?.trim() || null,
          precioEstimado: it.precioEstimado ?? null,
          imagenUrl: it.imagenUrl,
          imagenPublicId: it.imagenPublicId,
        })),
      }),
    ])

    // Limpieza en Cloudinary de las imágenes que ya no se usan (sin romper si falla)
    const vigentes = new Set<string>(items.map((it) => it.imagenPublicId))
    if (cfg.imagenPublicId) vigentes.add(cfg.imagenPublicId)

    const anteriores = [
      ...(configAnterior?.imagenPublicId ? [configAnterior.imagenPublicId] : []),
      ...itemsAnteriores.map((a) => a.imagenPublicId),
    ]

    await Promise.allSettled(
      [...new Set(anteriores)].filter((id) => !vigentes.has(id)).map((id) => eliminarImagen(id))
    )

    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PUT /api/admin/proximamente]', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
