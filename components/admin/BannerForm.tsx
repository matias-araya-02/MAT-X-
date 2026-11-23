'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ImagePlus, X } from 'lucide-react'

interface BannerData {
  activo: boolean
  imagenUrl: string | null
  imagenPublicId: string | null
  overlay: number
  altura: number
  intensidad: number
  anchoCompleto: boolean
  titulo: string | null
  subtitulo: string | null
  botonTexto: string | null
  botonUrl: string | null
}

interface Props {
  banner: BannerData | null
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

export function BannerForm({ banner }: Props) {
  const router = useRouter()

  const [activo, setActivo] = useState(banner?.activo ?? false)
  const [overlay, setOverlay] = useState(banner?.overlay ?? 40)
  const [altura, setAltura] = useState(banner?.altura ?? 480)
  const [intensidad, setIntensidad] = useState(banner?.intensidad ?? 60)
  const [anchoCompleto, setAnchoCompleto] = useState(banner?.anchoCompleto ?? true)
  const [titulo, setTitulo] = useState(banner?.titulo ?? '')
  const [subtitulo, setSubtitulo] = useState(banner?.subtitulo ?? '')
  const [botonTexto, setBotonTexto] = useState(banner?.botonTexto ?? '')
  const [botonUrl, setBotonUrl] = useState(banner?.botonUrl ?? '')

  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  // Imagen
  const [imagenActual, setImagenActual] = useState<ImagenSubida | null>(
    banner?.imagenUrl && banner.imagenPublicId
      ? { url: banner.imagenUrl, publicId: banner.imagenPublicId }
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

  function elegirImagen(file: File | undefined) {
    if (!file) return

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorImagen('Formato no permitido. Usá PNG, WebP o JPG.')
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
    setGuardado(false)
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
    setGuardado(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setGuardado(false)

    try {
      // Imagen que se va a guardar: la ya existente o la nueva (que se sube ahora)
      let imagen: ImagenSubida | null = imagenActual

      if (imagenNueva) {
        let subida = imagenSubida

        if (!subida) {
          setProgreso('Subiendo imagen...')

          const fd = new FormData()
          fd.append('file', imagenNueva.file)
          fd.append('folder', 'banner')

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

      const res = await fetch('/api/admin/banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activo,
          imagenUrl: imagen?.url ?? null,
          imagenPublicId: imagen?.publicId ?? null,
          overlay,
          altura,
          intensidad,
          anchoCompleto,
          titulo: titulo.trim() || null,
          subtitulo: subtitulo.trim() || null,
          botonTexto: botonTexto.trim() || null,
          botonUrl: botonUrl.trim() || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }

      // La imagen nueva pasa a ser la guardada
      if (imagenNueva) URL.revokeObjectURL(imagenNueva.preview)
      previewRef.current = null
      setImagenActual(imagen)
      setImagenNueva(null)
      setImagenSubida(null)
      setGuardado(true)
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mostrar / ocultar */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => {
            setActivo(e.target.checked)
            setGuardado(false)
          }}
          disabled={loading}
          className="h-4 w-4 accent-primary"
        />
        <span className="font-mono text-sm">Mostrar esta sección en la home</span>
      </label>

      {/* Vista previa */}
      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-2">
          Vista previa
        </label>

        <div
          className="relative w-full overflow-hidden border border-primary/20 bg-zinc-900"
          style={{ aspectRatio: `${anchoCompleto ? 1440 : 1248} / ${altura}` }}
        >
          {imagenMostrada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagenMostrada}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-zinc-400">
              Sin imagen
            </span>
          )}

          <div className="absolute inset-0 bg-black" style={{ opacity: overlay / 100 }} />

          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-white">
            {titulo && <p className="font-heading text-xl font-bold uppercase">{titulo}</p>}
            {subtitulo && <p className="font-mono text-xs text-white/80">{subtitulo}</p>}
            {botonTexto && botonUrl && (
              <span className="btn-primary pointer-events-none px-4 py-1.5 text-xs">
                {botonTexto}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-2 font-mono text-xs text-primary transition-colors hover:border-primary ${
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

        <p className="font-mono text-xs text-muted mt-2">
          Recomendado: horizontal y grande (por ejemplo 2400×1200) · lo importante al centro · PNG,
          WebP o JPG · máx 5MB
        </p>

        {errorImagen && (
          <p className="flex items-center gap-1.5 font-mono text-xs text-red-500 mt-2">
            <AlertTriangle size={12} className="flex-shrink-0" />
            {errorImagen}
          </p>
        )}
      </div>

      {/* Oscurecer */}
      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Oscurecer imagen: {overlay}%
        </label>
        <input
          type="range"
          min={0}
          max={80}
          step={5}
          value={overlay}
          onChange={(e) => {
            setOverlay(Number(e.target.value))
            setGuardado(false)
          }}
          disabled={loading}
          className="w-full max-w-xs accent-primary"
        />
        <p className="font-mono text-xs text-muted mt-1">
          Ayuda a que el texto se lea bien. Con 0% la imagen se ve tal cual.
        </p>
      </div>

      {/* Tamaño y efecto */}
      <div className="space-y-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={anchoCompleto}
            onChange={(e) => {
              setAnchoCompleto(e.target.checked)
              setGuardado(false)
            }}
            disabled={loading}
            className="h-4 w-4 accent-primary"
          />
          <span className="font-mono text-sm">Ocupar todo el ancho de la pantalla</span>
        </label>
        <p className="font-mono text-xs text-muted -mt-3">
          Si lo desactivás, la sección se alinea con el resto de la página y la imagen se ve más
          chica y menos recortada.
        </p>

        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Altura: {altura}px
          </label>
          <input
            type="range"
            min={280}
            max={800}
            step={20}
            value={altura}
            onChange={(e) => {
              setAltura(Number(e.target.value))
              setGuardado(false)
            }}
            disabled={loading}
            className="w-full max-w-xs accent-primary"
          />
          <p className="font-mono text-xs text-muted mt-1">
            Más altura muestra más de la imagen. En celular se reduce un 25%.
          </p>
        </div>

        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Intensidad del efecto parallax: {intensidad}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={intensidad}
            onChange={(e) => {
              setIntensidad(Number(e.target.value))
              setGuardado(false)
            }}
            disabled={loading}
            className="w-full max-w-xs accent-primary"
          />
          <p className="font-mono text-xs text-muted mt-1">
            Con 0% la imagen queda quieta. Con 100% el movimiento es el más marcado.
          </p>
        </div>
      </div>

      {/* Texto */}
      <div className="space-y-4">
        <p className="font-mono text-xs text-muted">
          El texto es opcional: si dejás todo vacío, se muestra solo la imagen.
        </p>

        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Título
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Subtítulo
          </label>
          <input
            type="text"
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            maxLength={200}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
              Texto del botón
            </label>
            <input
              type="text"
              value={botonTexto}
              onChange={(e) => setBotonTexto(e.target.value)}
              maxLength={40}
              className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              placeholder="Ver productos"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
              Enlace del botón
            </label>
            <input
              type="text"
              value={botonUrl}
              onChange={(e) => setBotonUrl(e.target.value)}
              maxLength={300}
              className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              placeholder="/productos"
            />
          </div>
        </div>
        <p className="font-mono text-xs text-muted">
          El enlace puede ser una página de tu tienda (/productos) o una dirección completa
          (https://...).
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? progreso || 'Guardando...' : 'Guardar cambios'}
        </button>
        {guardado && !loading && (
          <span className="font-mono text-sm text-green-600">✓ Guardado</span>
        )}
      </div>
    </form>
  )
}
