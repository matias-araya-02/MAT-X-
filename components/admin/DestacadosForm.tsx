'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ImagePlus, X } from 'lucide-react'

interface ProductoOpcion {
  id: string
  nombre: string
}

interface SlotGuardado {
  productoId: string
  imagenUrl: string
  imagenPublicId: string
}

interface Props {
  productos: ProductoOpcion[]
  iniciales: (SlotGuardado | null)[]
}

interface SlotState {
  productoId: string
  actual: { url: string; publicId: string } | null
  nuevo: { file: File; preview: string } | null
}

const MAX_BYTES = 5 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/png', 'image/webp', 'image/jpeg']

async function borrarSubido(publicId: string) {
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

export function DestacadosForm({ productos, iniciales }: Props) {
  const router = useRouter()

  const [slots, setSlots] = useState<SlotState[]>(
    [0, 1, 2].map((i) => {
      const s = iniciales[i]
      return {
        productoId: s?.productoId ?? '',
        actual: s ? { url: s.imagenUrl, publicId: s.imagenPublicId } : null,
        nuevo: null,
      }
    })
  )
  const [errores, setErrores] = useState<(string | null)[]>([null, null, null])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')

  // Liberar las vistas previas al salir
  const slotsRef = useRef(slots)
  useEffect(() => {
    slotsRef.current = slots
  })
  useEffect(() => {
    return () => {
      slotsRef.current.forEach((s) => s.nuevo && URL.revokeObjectURL(s.nuevo.preview))
    }
  }, [])

  function actualizar(i: number, patch: Partial<SlotState>) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  function setErrorSlot(i: number, msg: string | null) {
    setErrores((prev) => prev.map((e, idx) => (idx === i ? msg : e)))
  }

  function elegirImagen(i: number, file: File | undefined) {
    if (!file) return
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorSlot(i, 'Formato no permitido. Usá PNG, WebP o JPG.')
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorSlot(i, 'La imagen no puede superar 5MB')
      return
    }
    setErrorSlot(i, null)
    const anterior = slots[i].nuevo
    if (anterior) URL.revokeObjectURL(anterior.preview)
    actualizar(i, { nuevo: { file, preview: URL.createObjectURL(file) } })
  }

  function vaciar(i: number) {
    const anterior = slots[i].nuevo
    if (anterior) URL.revokeObjectURL(anterior.preview)
    setErrorSlot(i, null)
    actualizar(i, { productoId: '', actual: null, nuevo: null })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validar antes de subir nada
    for (let i = 0; i < 3; i++) {
      const s = slots[i]
      const vacio = !s.productoId && !s.actual && !s.nuevo
      if (vacio) continue
      if (!s.productoId) return setError(`Espacio ${i + 1}: elegí un producto`)
      if (!s.actual && !s.nuevo) return setError(`Espacio ${i + 1}: subí una imagen`)
    }

    setLoading(true)
    const subidos: string[] = [] // imágenes subidas en este intento, por si falla el guardado

    try {
      const payload: {
        orden: number
        productoId: string
        imagenUrl: string
        imagenPublicId: string
      }[] = []

      for (let i = 0; i < 3; i++) {
        const s = slots[i]
        if (!s.productoId) continue

        let img = s.actual
        if (s.nuevo) {
          setProgreso(`Subiendo imagen ${i + 1}...`)
          const fd = new FormData()
          fd.append('file', s.nuevo.file)
          fd.append('folder', 'destacados')

          const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const data = await up.json()
          if (!up.ok) throw new Error(data.error ?? 'Error al subir la imagen')

          img = { url: data.url, publicId: data.publicId }
          subidos.push(data.publicId)
        }

        payload.push({
          orden: i,
          productoId: s.productoId,
          imagenUrl: img!.url,
          imagenPublicId: img!.publicId,
        })
      }

      setProgreso('Guardando...')
      const res = await fetch('/api/admin/destacados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: payload }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al guardar')
      }

      router.refresh()
      // Las imágenes nuevas pasan a ser las guardadas
      setSlots((prev) =>
        prev.map((s, i) => {
          const guardado = payload.find((p) => p.orden === i)
          if (s.nuevo) URL.revokeObjectURL(s.nuevo.preview)
          return {
            productoId: s.productoId,
            actual: guardado ? { url: guardado.imagenUrl, publicId: guardado.imagenPublicId } : null,
            nuevo: null,
          }
        })
      )
      setProgreso('Guardado ✓')
    } catch (err) {
      await Promise.all(subidos.map(borrarSubido))
      setError(err instanceof Error ? err.message : 'Error de conexión')
      setProgreso('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600 max-w-3xl">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {slots.map((s, i) => {
          const imagen = s.nuevo?.preview ?? s.actual?.url ?? null
          const ocupado = !!(s.productoId || imagen)

          return (
            <div key={i} className="border border-primary/20 bg-white p-4 space-y-3">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider">
                Espacio {i + 1}
              </h2>

              <div className="relative aspect-[3/4] w-full border border-primary/20 bg-surface">
                {imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
                    Sin imagen
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-2 font-mono text-xs text-primary transition-colors hover:border-primary ${
                    loading ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <ImagePlus size={14} />
                  {imagen ? 'Cambiar imagen' : 'Elegir imagen'}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    disabled={loading}
                    onChange={(e) => {
                      elegirImagen(i, e.target.files?.[0])
                      e.target.value = ''
                    }}
                    className="hidden"
                  />
                </label>

                {ocupado && (
                  <button
                    type="button"
                    onClick={() => vaciar(i)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    <X size={12} />
                    Vaciar espacio
                  </button>
                )}
              </div>

              {errores[i] && (
                <p className="flex items-center gap-1.5 font-mono text-xs text-red-500">
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  {errores[i]}
                </p>
              )}

              <div>
                <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
                  Producto
                </label>
                <select
                  value={s.productoId}
                  onChange={(e) => actualizar(i, { productoId: e.target.value })}
                  disabled={loading}
                  className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">— Elegir producto —</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      <p className="font-mono text-xs text-muted">
        Imagen vertical (proporción 3:4, por ejemplo 1200×1600) · PNG, WebP o JPG · máx 5MB
      </p>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? progreso || 'Guardando...' : 'Guardar cambios'}
        </button>
        {!loading && progreso && (
          <span className="font-mono text-sm text-green-600">{progreso}</span>
        )}
      </div>
    </form>
  )
}
