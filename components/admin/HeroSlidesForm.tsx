'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowDown, ArrowUp, Check, ImagePlus, Plus, X } from 'lucide-react'

interface ProductoOpcion {
  id: string
  nombre: string
  activo: boolean
  marca: string | null
}

interface SlideInicial {
  productoId: string
  palabra: string | null
  activo: boolean
  imagenUrl: string
  imagenPublicId: string
}

interface Props {
  slides: SlideInicial[]
  productos: ProductoOpcion[]
}

// Imagen ya guardada o ya subida a Cloudinary
interface ImagenSubida {
  url: string
  publicId: string
}

// Imagen elegida pero todavía sin subir
interface ImagenNueva {
  file: File
  preview: string
}

interface SlideEstado {
  key: string
  productoId: string
  palabra: string
  activo: boolean
  actual: ImagenSubida | null
  nueva: ImagenNueva | null
  subida: ImagenSubida | null // subida en un intento de guardado que falló
}

const MAX_SLIDES = 7
// 4MB: las funciones de Vercel rechazan cuerpos de más de ~4,5MB
const MAX_BYTES = 4 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/png', 'image/webp', 'image/jpeg']

// Borra de Cloudinary una imagen subida que ya no se va a usar (sin romper si falla)
async function borrarSubida(publicId: string) {
  try {
    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })
  } catch {
    /* best-effort */
  }
}

export function HeroSlidesForm({ slides: iniciales, productos }: Props) {
  const router = useRouter()

  const [slides, setSlides] = useState<SlideEstado[]>(() =>
    iniciales.map((s, i) => ({
      key: `slide-${i}`,
      productoId: s.productoId,
      palabra: s.palabra ?? '',
      activo: s.activo,
      actual: { url: s.imagenUrl, publicId: s.imagenPublicId },
      nueva: null,
      subida: null,
    }))
  )
  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorImagen, setErrorImagen] = useState<{ key: string; texto: string } | null>(null)
  const [guardado, setGuardado] = useState(false)

  // Para generar claves únicas de slides nuevos
  const contador = useRef(iniciales.length)
  function nuevaKey() {
    contador.current += 1
    return `slide-${contador.current}`
  }

  // Liberar las vistas previas al salir del formulario
  const slidesRef = useRef(slides)
  slidesRef.current = slides
  useEffect(() => {
    return () => {
      slidesRef.current.forEach((s) => {
        if (s.nueva) URL.revokeObjectURL(s.nueva.preview)
      })
    }
  }, [])

  function actualizar(key: string, cambios: Partial<SlideEstado>) {
    setSlides((prev) => prev.map((s) => (s.key === key ? { ...s, ...cambios } : s)))
    setGuardado(false)
  }

  function agregar() {
    if (slides.length >= MAX_SLIDES) return
    setSlides((prev) => [
      ...prev,
      {
        key: nuevaKey(),
        productoId: '',
        palabra: '',
        activo: true,
        actual: null,
        nueva: null,
        subida: null,
      },
    ])
    setGuardado(false)
  }

  function quitar(key: string) {
    const slide = slides.find((s) => s.key === key)
    if (slide?.nueva) URL.revokeObjectURL(slide.nueva.preview)
    if (slide?.subida) void borrarSubida(slide.subida.publicId)
    setSlides((prev) => prev.filter((s) => s.key !== key))
    setGuardado(false)
  }

  function mover(key: string, direccion: -1 | 1) {
    setSlides((prev) => {
      const i = prev.findIndex((s) => s.key === key)
      const j = i + direccion
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const copia = [...prev]
      const temp = copia[i]
      copia[i] = copia[j]
      copia[j] = temp
      return copia
    })
    setGuardado(false)
  }

  function elegirImagen(key: string, file: File | undefined) {
    if (!file) return

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorImagen({ key, texto: 'Formato no permitido. Usá PNG, WebP o JPG.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorImagen({ key, texto: 'La imagen no puede superar 4MB' })
      return
    }

    setErrorImagen(null)

    const slide = slides.find((s) => s.key === key)
    if (slide?.nueva) URL.revokeObjectURL(slide.nueva.preview)
    // Si ya se había subido otra imagen en un intento anterior, se descarta
    if (slide?.subida) void borrarSubida(slide.subida.publicId)

    actualizar(key, {
      nueva: { file, preview: URL.createObjectURL(file) },
      subida: null,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardado(false)

    if (slides.some((s) => !s.productoId)) {
      setError('Elegí un producto en cada slide.')
      return
    }
    if (slides.some((s) => !s.actual && !s.nueva)) {
      setError('Cada slide necesita una imagen.')
      return
    }

    setLoading(true)

    try {
      const resultado: {
        productoId: string
        palabra: string | null
        activo: boolean
        imagenUrl: string
        imagenPublicId: string
      }[] = []

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i]
        let imagen: ImagenSubida | null = s.actual

        if (s.nueva) {
          let subida: ImagenSubida | null = s.subida

          if (!subida) {
            setProgreso(`Subiendo imagen ${i + 1} de ${slides.length}...`)

            const fd = new FormData()
            fd.append('file', s.nueva.file)
            fd.append('folder', 'hero')

            const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
            const upData = await up.json()

            if (!up.ok) {
              setError(upData.error ?? `Error al subir la imagen del slide ${i + 1}`)
              return
            }

            const creada: ImagenSubida = { url: upData.url, publicId: upData.publicId }
            subida = creada
            // Se guarda en el estado: si algo falla más adelante, el reintento no la sube de nuevo
            setSlides((prev) =>
              prev.map((x) => (x.key === s.key ? { ...x, subida: creada } : x))
            )
          }

          imagen = subida
        }

        if (!imagen) {
          setError('Cada slide necesita una imagen.')
          return
        }

        resultado.push({
          productoId: s.productoId,
          palabra: s.palabra.trim() || null,
          activo: s.activo,
          imagenUrl: imagen.url,
          imagenPublicId: imagen.publicId,
        })
      }

      setProgreso('Guardando...')

      const res = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: resultado }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }

      // Las imágenes nuevas pasan a ser las guardadas
      slides.forEach((s) => {
        if (s.nueva) URL.revokeObjectURL(s.nueva.preview)
      })
      setSlides((prev) =>
        prev.map((s, i) => ({
          ...s,
          actual: { url: resultado[i].imagenUrl, publicId: resultado[i].imagenPublicId },
          nueva: null,
          subida: null,
        }))
      )
      setGuardado(true)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setProgreso('')
    }
  }

  function etiqueta(p: ProductoOpcion) {
    return `${p.marca ? `${p.marca} · ` : ''}${p.nombre}${p.activo ? '' : ' (inactivo)'}`
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {slides.length === 0 && (
        <p className="border border-dashed border-primary/30 p-6 text-center font-mono text-xs text-muted">
          Todavía no hay slides. Agregá el primero con el botón de abajo.
        </p>
      )}

      <div className="space-y-4">
        {slides.map((s, i) => {
          const imagenMostrada = s.nueva?.preview ?? s.actual?.url ?? null

          return (
            <div key={s.key} className="border border-primary/20 bg-surface p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                  Slide {String(i + 1).padStart(2, '0')}
                </h3>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => mover(s.key, -1)}
                    disabled={loading || i === 0}
                    aria-label="Subir slide"
                    className="p-1.5 text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(s.key, 1)}
                    disabled={loading || i === slides.length - 1}
                    aria-label="Bajar slide"
                    className="p-1.5 text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(s.key)}
                    disabled={loading}
                    aria-label="Quitar slide"
                    className="p-1.5 text-red-400 transition-colors hover:text-red-600 disabled:opacity-40"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Imagen */}
                <div className="flex-shrink-0">
                  <div className="relative h-28 w-44 overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 to-white">
                    {imagenMostrada ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagenMostrada}
                        alt=""
                        className="absolute inset-0 h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
                        Sin imagen
                      </span>
                    )}
                  </div>

                  <label
                    className={`mt-2 inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-1.5 font-mono text-xs text-primary transition-colors hover:border-primary ${
                      loading ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <ImagePlus size={14} />
                    {imagenMostrada ? 'Cambiar imagen' : 'Elegir imagen'}
                    <input
                      type="file"
                      accept="image/png,image/webp,image/jpeg"
                      disabled={loading}
                      onChange={(e) => {
                        elegirImagen(s.key, e.target.files?.[0])
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                  </label>

                  {errorImagen?.key === s.key && (
                    <p className="mt-2 flex max-w-[11rem] items-start gap-1.5 font-mono text-xs text-red-500">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      {errorImagen.texto}
                    </p>
                  )}
                </div>

                {/* Datos */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted">
                      Producto *
                    </label>
                    <select
                      value={s.productoId}
                      onChange={(e) => actualizar(s.key, { productoId: e.target.value })}
                      disabled={loading}
                      className="w-full border border-primary/30 bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">Elegí un producto</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {etiqueta(p)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted">
                      Palabra de fondo
                    </label>
                    <input
                      type="text"
                      value={s.palabra}
                      onChange={(e) => actualizar(s.key, { palabra: e.target.value })}
                      maxLength={14}
                      disabled={loading}
                      placeholder="Opcional (ej: R82HE)"
                      className="w-full border border-primary/30 bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                    />
                    <p className="mt-1 font-mono text-xs text-muted">
                      Máx. 14 caracteres. Si la dejás vacía se usa el nombre del producto (o su
                      categoría si es muy largo).
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.activo}
                      onChange={(e) => actualizar(s.key, { activo: e.target.checked })}
                      disabled={loading}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-mono text-sm">Mostrar este slide en la home</span>
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={agregar}
          disabled={loading || slides.length >= MAX_SLIDES}
          className="inline-flex items-center gap-2 border border-primary/30 px-4 py-2 font-mono text-xs text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Agregar slide
        </button>
        <span className="font-mono text-xs text-muted">
          {slides.length} de {MAX_SLIDES}
        </span>
      </div>

      <p className="font-mono text-xs text-muted">
        Usá fotos recortadas (PNG o WebP con fondo transparente), de al menos 1400px de ancho y
        con proporción parecida entre sí. Máx. 4MB.
      </p>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? progreso || 'Guardando...' : 'Guardar cambios'}
        </button>
        {guardado && !loading && (
          <span className="inline-flex items-center gap-1.5 font-mono text-sm text-green-600">
            <Check size={14} />
            Guardado
          </span>
        )}
      </div>
    </form>
  )
}
