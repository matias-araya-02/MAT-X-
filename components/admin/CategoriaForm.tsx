'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ImagePlus, X } from 'lucide-react'

interface CategoriaData {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagenUrl: string | null
  imagenPublicId: string | null
  imagenEscala: number
  orden: number
}

interface Props {
  categoria?: CategoriaData
  ordenSugerido?: number
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

const MAX_BYTES = 5 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

export function CategoriaForm({ categoria, ordenSugerido = 0 }: Props) {
  const router = useRouter()
  const isEditing = !!categoria

  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [slug, setSlug] = useState(categoria?.slug ?? '')
  const [autoSlug, setAutoSlug] = useState(!isEditing)
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '')
  const [escala, setEscala] = useState(categoria?.imagenEscala ?? 70)
  const [orden, setOrden] = useState(categoria?.orden ?? ordenSugerido)
  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Imagen
  const [imagenActual, setImagenActual] = useState<ImagenSubida | null>(
    categoria?.imagenUrl && categoria.imagenPublicId
      ? { url: categoria.imagenUrl, publicId: categoria.imagenPublicId }
      : null
  )
  const [imagenNueva, setImagenNueva] = useState<ImagenNueva | null>(null)
  const [imagenSubida, setImagenSubida] = useState<ImagenSubida | null>(null)
  const [errorImagen, setErrorImagen] = useState<string | null>(null)

  // Liberar la vista previa al salir del formulario
  const previewRef = useRef<string | null>(null)
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function onNombreChange(value: string) {
    setNombre(value)
    if (autoSlug) setSlug(slugify(value))
  }

  function elegirImagen(file: File | undefined) {
    if (!file) return

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorImagen('Formato no permitido. Usá SVG, PNG, WebP o JPG.')
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorImagen('La imagen no puede superar 5MB')
      return
    }

    setErrorImagen(null)
    if (imagenNueva) URL.revokeObjectURL(imagenNueva.preview)

    // Si ya se había subido otra imagen en un intento anterior, se descarta
    if (imagenSubida) {
      void borrarSubida(imagenSubida.publicId)
      setImagenSubida(null)
    }

    const preview = URL.createObjectURL(file)
    previewRef.current = preview
    setImagenNueva({ file, preview })
  }

  function quitarImagen() {
    if (imagenNueva) URL.revokeObjectURL(imagenNueva.preview)
    previewRef.current = null

    if (imagenSubida) {
      void borrarSubida(imagenSubida.publicId)
      setImagenSubida(null)
    }

    setImagenNueva(null)
    setImagenActual(null) // al guardar, la imagen guardada se elimina
    setErrorImagen(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Imagen que se va a guardar: la ya existente o la nueva (que se sube ahora)
      let imagen: ImagenSubida | null = imagenActual

      if (imagenNueva) {
        let subida = imagenSubida

        if (!subida) {
          setProgreso('Subiendo imagen...')

          const fd = new FormData()
          fd.append('file', imagenNueva.file)
          fd.append('folder', 'categorias')

          const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const upData = await up.json()

          if (!up.ok) {
            setError(upData.error ?? 'Error al subir la imagen')
            return
          }

          subida = { url: upData.url, publicId: upData.publicId }
          setImagenSubida(subida)
        }

        imagen = subida
      }

      setProgreso('Guardando...')

      const res = await fetch(
        isEditing ? `/api/admin/categorias/${categoria!.id}` : '/api/admin/categorias',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            slug,
            descripcion: descripcion.trim() || null,
            imagenUrl: imagen?.url ?? null,
            imagenPublicId: imagen?.publicId ?? null,
            imagenEscala: escala,
            orden,
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }

      router.push('/admin/categorias')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setProgreso('')
    }
  }

  const imagenMostrada = imagenNueva?.preview ?? imagenActual?.url ?? null

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Nombre *
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          required
          maxLength={60}
          className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="Teclados"
        />
      </div>

      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Slug (URL) *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setAutoSlug(false)
              setSlug(e.target.value)
            }}
            required
            maxLength={60}
            className="flex-1 bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="teclados"
          />
          {!autoSlug && (
            <button
              type="button"
              onClick={() => {
                setAutoSlug(true)
                setSlug(slugify(nombre))
              }}
              className="font-mono text-xs text-primary px-2 hover:underline whitespace-nowrap"
            >
              Auto
            </button>
          )}
        </div>
        <p className="font-mono text-xs text-muted mt-1">
          Se usa en los filtros de la tienda: /productos?categoria={slug || 'slug'}
          {isEditing && ' · Si lo cambiás, los links viejos a esta categoría dejan de funcionar.'}
        </p>
      </div>

      {/* Imagen */}
      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Imagen
        </label>

        <div className="flex items-start gap-4">
          <div className="relative aspect-[4/3] w-48 border border-primary/20 bg-white">
            {imagenMostrada ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagenMostrada}
                  alt={nombre ? `Imagen de ${nombre}` : 'Imagen'}
                  className="object-contain"
                  style={{ width: `${escala}%`, height: `${escala}%` }}
                />
              </div>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
                Sin imagen
              </span>
            )}
          </div>

          <div className="flex flex-col items-start gap-2">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-2 font-mono text-xs text-primary transition-colors hover:border-primary ${
                loading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <ImagePlus size={14} />
              {imagenMostrada ? 'Cambiar imagen' : 'Elegir imagen'}
              <input
                type="file"
                accept="image/svg+xml,image/png,image/webp,image/jpeg"
                disabled={loading}
                onChange={(e) => {
                  elegirImagen(e.target.files?.[0])
                  e.target.value = ''
                }}
                className="hidden"
              />
            </label>

            {imagenMostrada && (
              <button
                type="button"
                onClick={quitarImagen}
                disabled={loading}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                <X size={12} />
                Quitar imagen
              </button>
            )}
          </div>
        </div>

        {imagenMostrada && (
          <div className="mt-4">
            <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
              Tamaño en la tarjeta: {escala}%
            </label>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={escala}
              onChange={(e) => setEscala(Number(e.target.value))}
              disabled={loading}
              className="w-full max-w-xs accent-primary"
            />
          </div>
        )}

        <p className="font-mono text-xs text-muted mt-2">
          Ideal: logo en SVG con fondo transparente · también PNG, WebP o JPG · máx 5MB
        </p>

        {errorImagen && (
          <p className="flex items-center gap-1.5 font-mono text-xs text-red-500 mt-2">
            <AlertTriangle size={12} className="flex-shrink-0" />
            {errorImagen}
          </p>
        )}
      </div>

      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Descripción
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={80}
          className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="Mecánicos y compactos"
        />
        <p className="font-mono text-xs text-muted mt-1">
          Texto corto debajo de la imagen · opcional, podés dejarlo vacío
        </p>
      </div>

      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Orden *
        </label>
        <input
          type="number"
          min={0}
          max={999}
          value={orden}
          onChange={(e) => setOrden(Number(e.target.value))}
          required
          className="w-28 bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
        />
        <p className="font-mono text-xs text-muted mt-1">
          Las categorías con número menor aparecen primero.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? progreso || 'Guardando...'
            : isEditing
              ? 'Guardar cambios'
              : 'Crear categoría'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/categorias')}
          disabled={loading}
          className="font-mono text-sm text-muted hover:text-text px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
