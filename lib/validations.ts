import { z } from 'zod'

// Item de pedido que envía el cliente (solo IDs y cantidad)
export const pedidoItemSchema = z.object({
  productoId: z.string().min(1),
  varianteId: z.string().min(1).optional(),
  cantidad: z.number().int().min(1).max(10),
})

// Body del POST /api/pedidos
export const pedidoSchema = z.object({
  items: z.array(pedidoItemSchema).min(1).max(20),
  nombreCliente: z.string().min(2).max(100).optional(),
  telefono: z.string().min(7).max(20).optional(),
  notas: z.string().max(500).optional(),
})

export type PedidoItem = z.infer<typeof pedidoItemSchema>
export type PedidoInput = z.infer<typeof pedidoSchema>

export const destacadoHomeSlotSchema = z.object({
  orden: z.number().int().min(0).max(2),
  productoId: z.string().min(1),
  imagenUrl: z.string().url().startsWith('https://res.cloudinary.com/'),
  imagenPublicId: z.string().min(1),
})

export const destacadosHomeSchema = z
  .object({ slots: z.array(destacadoHomeSlotSchema).max(3) })
  .refine((d) => new Set(d.slots.map((s) => s.orden)).size === d.slots.length, {
    message: 'Hay posiciones repetidas',
  })

export const categoriaSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(60),
    slug: z
      .string()
      .trim()
      .min(1, 'El slug es obligatorio')
      .max(60)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo admite minúsculas, números y guiones'),
    descripcion: z.string().trim().max(80).nullable().optional(),
    imagenUrl: z
      .string()
      .url()
      .startsWith('https://res.cloudinary.com/')
      .nullable()
      .optional(),
    imagenPublicId: z.string().trim().min(1).max(200).nullable().optional(),
    imagenEscala: z.number().int().min(20).max(100),
    orden: z.number().int().min(0).max(999),
  })
  .refine((d) => !!d.imagenUrl === !!d.imagenPublicId, {
    message: 'La imagen es inválida',
  })

export const bannerParallaxSchema = z
  .object({
    activo: z.boolean(),
    imagenUrl: z.string().url().startsWith('https://res.cloudinary.com/').nullable(),
    imagenPublicId: z.string().trim().min(1).max(200).nullable(),
    overlay: z.number().int().min(0).max(80),
    altura: z.number().int().min(280).max(800),
    intensidad: z.number().int().min(0).max(100),
    anchoCompleto: z.boolean(),
    titulo: z.string().trim().max(120).nullable(),
    subtitulo: z.string().trim().max(200).nullable(),
    botonTexto: z.string().trim().max(40).nullable(),
    botonUrl: z.string().trim().max(300).nullable(),
  })
  .refine((d) => !!d.imagenUrl === !!d.imagenPublicId, {
    message: 'La imagen es inválida',
  })
  .refine((d) => !d.activo || !!d.imagenUrl, {
    message: 'Para mostrar la sección tenés que subir una imagen',
  })
  .refine((d) => !d.botonTexto || !!d.botonUrl, {
    message: 'El botón necesita un enlace',
  })
  .refine((d) => !d.botonUrl || /^(\/(?!\/)|https?:\/\/)/.test(d.botonUrl), {
    message: 'El enlace debe empezar con / o con https://',
  })



