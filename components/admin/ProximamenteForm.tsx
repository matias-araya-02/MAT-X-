'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowDown, ArrowUp, Check, ImagePlus, Plus, Video, X } from 'lucide-react'

interface MarcaOpcion {
  id: string
  nombre: string
}

interface ConfigInicial {
  activo: boolean
  titulo: string | null
  subtitulo: string | null
  videoUrl: string | null
  imagenUrl: string | null
  imagenPublicId: string | null
  enlaceTexto: string | null
  enlaceUrl: string | null
}

interface ItemInicial {
  nombre: string
  categoriaId: string | null
  marcaId: string | null
  llegada: string | null
  precioEstimado: number | null
  activo: boolean
  imagenUrl: string
  imagenPublicId: string
}

interface Props {
  config: ConfigInicial | null
  items: ItemInicial[]
  categorias: MarcaOpcion[]
  marcas: MarcaOpcion[]
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

interface ImagenEstado {
  actual: ImagenSubida | null
  nueva: ImagenNueva | null
  subida: ImagenSubida | null // subida en un intento de guardado que falló
}

interface ItemEstado {
  key: string
  nombre: string
  categoriaId: string // '' = sin categoría
  marcaId: string // '' = sin marca
  llegada: string
  precio: string
  activo: boolean
  imagen: ImagenEstado
}

const MAX_ITEMS = 12
// 4MB: las funciones de Vercel rechazan cuerpos de más de ~4,5MB
const MAX_BYTES = 4 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/png', 'image/webp', 'image/jpeg']
// El video sube directo a Cloudinary desde el navegador (no pasa por Vercel)
const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const TIPOS_VIDEO = ['video/mp4', 'video/webm']

const INPUT =
  'w-full border border-primary/30 bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none'
const ETIQUETA = 'mb-1 block font-mono text-xs uppercase tracking-wider text-muted'

function validarArchivo(file: File): string | null {
  if (!TIPOS_PERMITIDOS.includes(file.type)) return 'Formato no permitido. Usá PNG, WebP o JPG.'
  if (file.size > MAX_BYTES) return 'La imagen no puede superar 4MB'
  return null
}

function validarVideo(file: File): string | null {
  if (!TIPOS_VIDEO.includes(file.type)) return 'Formato no permitido. Usá MP4 o WebM.'
  if (file.size > MAX_VIDEO_BYTES) return 'El video no puede superar 25MB'
  return null
}

// Borra de Cloudinary un archivo subido que ya no se va a usar (sin romper si falla)
async function borrarSubida(publicId: string, resourceType: 'image' | 'video' = 'image') {
  try {
    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, resourceType }),
    })
  } catch {
    /* best-effort */
  }
}

async function subirVideoDirecto(file: File): Promise<ImagenSubida> {
  let signRes: Response
  try {
    signRes = await fetch('/api/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'proximamente' }),
    })
  } catch {
    throw new Error('Error de conexión al preparar la subida del video')
  }

  const signData = await signRes.json()
  if (!signRes.ok) throw new Error(signData.error ?? 'Error al preparar la subida del video')

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', signData.apiKey)
  fd.append('timestamp', String(signData.timestamp))
  fd.append('signature', signData.signature)
  fd.append('folder', signData.folder)

  let uploadRes: Response
  try {
    uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`,
      { method: 'POST', body: fd }
    )
  } catch {
    throw new Error('Error de conexión al subir el video a Cloudinary')
  }

  const uploadData = await uploadRes.json()
  if (!uploadRes.ok) {
    throw new Error(uploadData.error?.message ?? 'Error al subir el video a Cloudinary')
  }

  return { url: uploadData.secure_url, publicId: uploadData.public_id }
}

async function subirImagen(file: File): Promise<ImagenSubida> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', 'proximamente')

  let res: Response
  try {
    res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
  } catch {
    throw new Error('Error de conexión al subir la imagen')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error al subir la imagen')
  return { url: data.url, publicId: data.publicId }
}

// Elige un archivo nuevo: libera la vista previa anterior y descarta una subida previa
function conArchivoNuevo(img: ImagenEstado, file: File): ImagenEstado {
  if (img.nueva) URL.revokeObjectURL(img.nueva.preview)
  if (img.subida) void borrarSubida(img.subida.publicId)
  return { actual: img.actual, nueva: { file, preview: URL.createObjectURL(file) }, subida: null }
}

function descartar(img: ImagenEstado) {
  if (img.nueva) URL.revokeObjectURL(img.nueva.preview)
  if (img.subida) void borrarSubida(img.subida.publicId)
}

export function ProximamenteForm({ config, items: iniciales, categorias, marcas }: Props) {
  const router = useRouter()

  // ── Card con video o imagen ──
  const [cardActiva, setCardActiva] = useState(config?.activo ?? false)
  const [titulo, setTitulo] = useState(config?.titulo ?? '')
  const [subtitulo, setSubtitulo] = useState(config?.subtitulo ?? '')
  const [videoUrl, setVideoUrl] = useState(config?.videoUrl ?? '')
  const [videoNuevo, setVideoNuevo] = useState<ImagenNueva | null>(null)
  const [videoSubido, setVideoSubido] = useState<ImagenSubida | null>(null)
  const [enlaceTexto, setEnlaceTexto] = useState(config?.enlaceTexto ?? '')
  const [enlaceUrl, setEnlaceUrl] = useState(config?.enlaceUrl ?? '')
  const [imagenCard, setImagenCard] = useState<ImagenEstado>({
    actual:
      config?.imagenUrl && config.imagenPublicId
        ? { url: config.imagenUrl, publicId: config.imagenPublicId }
        : null,
    nueva: null,
    subida: null,
  })

  // ── Productos próximos ──
  const [items, setItems] = useState<ItemEstado[]>(() =>
    iniciales.map((it, i) => ({
      key: `item-${i}`,
      nombre: it.nombre,
      categoriaId: it.categoriaId ?? '',
      marcaId: it.marcaId ?? '',
      llegada: it.llegada ?? '',
      precio: it.precioEstimado ? String(it.precioEstimado) : '',
      activo: it.activo,
      imagen: {
        actual: { url: it.imagenUrl, publicId: it.imagenPublicId },
        nueva: null,
        subida: null,
      },
    }))
  )

  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorImagen, setErrorImagen] = useState<{ key: string; texto: string } | null>(null)
  const [guardado, setGuardado] = useState(false)

  // Para generar claves únicas de productos nuevos
  const contador = useRef(iniciales.length)
  function nuevaKey() {
    contador.current += 1
    return `item-${contador.current}`
  }

  // Liberar las vistas previas al salir del formulario
  const estadoRef = useRef({ imagenCard, items, videoNuevo })
  estadoRef.current = { imagenCard, items, videoNuevo }
  useEffect(() => {
    return () => {
      const { imagenCard: card, items: lista, videoNuevo: vid } = estadoRef.current
      if (card.nueva) URL.revokeObjectURL(card.nueva.preview)
      if (vid) URL.revokeObjectURL(vid.preview)
      lista.forEach((it) => {
        if (it.imagen.nueva) URL.revokeObjectURL(it.imagen.nueva.preview)
      })
    }
  }, [])

  function marcarCambio() {
    setGuardado(false)
  }

  // ── Imagen de la card ──
  function elegirImagenCard(file: File | undefined) {
    if (!file) return
    const problema = validarArchivo(file)
    if (problema) {
      setErrorImagen({ key: 'card', texto: problema })
      return
    }
    setErrorImagen(null)
    setImagenCard(conArchivoNuevo(imagenCard, file))
    marcarCambio()
  }

  function quitarImagenCard() {
    descartar(imagenCard)
    setImagenCard({ actual: null, nueva: null, subida: null })
    setErrorImagen(null)
    marcarCambio()
  }

  // ── Video de la card ──
  function elegirVideo(file: File | undefined) {
    if (!file) return
    const problema = validarVideo(file)
    if (problema) {
      setErrorImagen({ key: 'video', texto: problema })
      return
    }
    setErrorImagen(null)
    if (videoNuevo) URL.revokeObjectURL(videoNuevo.preview)
    if (videoSubido) {
      void borrarSubida(videoSubido.publicId, 'video')
      setVideoSubido(null)
    }
    setVideoNuevo({ file, preview: URL.createObjectURL(file) })
    marcarCambio()
  }

  function quitarVideo() {
    if (videoNuevo) URL.revokeObjectURL(videoNuevo.preview)
    if (videoSubido) {
      void borrarSubida(videoSubido.publicId, 'video')
      setVideoSubido(null)
    }
    setVideoNuevo(null)
    setVideoUrl('')
    setErrorImagen(null)
    marcarCambio()
  }

  // ── Productos ──
  function actualizarItem(key: string, cambios: Partial<ItemEstado>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...cambios } : it)))
    marcarCambio()
  }

  function agregarItem() {
    if (items.length >= MAX_ITEMS) return
    setItems((prev) => [
      ...prev,
      {
        key: nuevaKey(),
        nombre: '',
        categoriaId: '',
        marcaId: '',
        llegada: '',
        precio: '',
        activo: true,
        imagen: { actual: null, nueva: null, subida: null },
      },
    ])
    marcarCambio()
  }

  function quitarItem(key: string) {
    const item = items.find((it) => it.key === key)
    if (item) descartar(item.imagen)
    setItems((prev) => prev.filter((it) => it.key !== key))
    marcarCambio()
  }

  function moverItem(key: string, direccion: -1 | 1) {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.key === key)
      const j = i + direccion
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const copia = [...prev]
      const temp = copia[i]
      copia[i] = copia[j]
      copia[j] = temp
      return copia
    })
    marcarCambio()
  }

  function elegirImagenItem(key: string, file: File | undefined) {
    if (!file) return
    const problema = validarArchivo(file)
    if (problema) {
      setErrorImagen({ key, texto: problema })
      return
    }
    setErrorImagen(null)
    const item = items.find((it) => it.key === key)
    if (!item) return
    actualizarItem(key, { imagen: conArchivoNuevo(item.imagen, file) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardado(false)

    // ── Validaciones ──
    const video = videoUrl.trim()
    const enlace = enlaceUrl.trim()

    if (!videoNuevo && video && !/^https:\/\//i.test(video)) {
      setError('La URL del video debe empezar con https://')
      return
    }
    if (enlace && !((enlace.startsWith('/') && !enlace.startsWith('//')) || /^https?:\/\//i.test(enlace))) {
      setError('El enlace de la card debe empezar con / o con https://')
      return
    }
    if (cardActiva && !video && !videoNuevo && !imagenCard.actual && !imagenCard.nueva) {
      setError('La card necesita un video o una imagen (o desactivala).')
      return
    }
    if (items.some((it) => !it.nombre.trim())) {
      setError('Escribí el nombre de cada producto.')
      return
    }
    if (items.some((it) => !it.imagen.actual && !it.imagen.nueva)) {
      setError('Cada producto necesita una imagen.')
      return
    }

    setLoading(true)

    try {
      // 1) Imagen y video de la card
      let imgCard: ImagenSubida | null = imagenCard.actual
      if (imagenCard.nueva) {
        let subida = imagenCard.subida
        if (!subida) {
          setProgreso('Subiendo imagen de la card...')
          const creada = await subirImagen(imagenCard.nueva.file)
          subida = creada
          setImagenCard((prev) => ({ ...prev, subida: creada }))
        }
        imgCard = subida
      }

      let videoFinal = video || null
      if (videoNuevo) {
        let subido = videoSubido
        if (!subido) {
          setProgreso('Subiendo video a Cloudinary...')
          const creado = await subirVideoDirecto(videoNuevo.file)
          subido = creado
          setVideoSubido(creado)
        }
        videoFinal = subido.url
      }

      // 2) Imágenes de los productos (en orden)
      const resueltas: ImagenSubida[] = []
      const itemsGuardar: {
        nombre: string
        categoriaId: string | null
        marcaId: string | null
        llegada: string | null
        precioEstimado: number | null
        activo: boolean
        imagenUrl: string
        imagenPublicId: string
      }[] = []

      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        let img: ImagenSubida | null = it.imagen.actual

        if (it.imagen.nueva) {
          let subida = it.imagen.subida
          if (!subida) {
            setProgreso(`Subiendo imagen ${i + 1} de ${items.length}...`)
            const creada = await subirImagen(it.imagen.nueva.file)
            subida = creada
            setItems((prev) =>
              prev.map((x) =>
                x.key === it.key ? { ...x, imagen: { ...x.imagen, subida: creada } } : x
              )
            )
          }
          img = subida
        }

        if (!img) throw new Error('Cada producto necesita una imagen.')

        resueltas.push(img)
        itemsGuardar.push({
          nombre: it.nombre.trim(),
          categoriaId: it.categoriaId || null,
          marcaId: it.marcaId || null,
          llegada: it.llegada.trim() || null,
          precioEstimado: it.precio ? parseInt(it.precio, 10) || null : null,
          activo: it.activo,
          imagenUrl: img.url,
          imagenPublicId: img.publicId,
        })
      }

      // 3) Guardar todo
      setProgreso('Guardando...')

      let res: Response
      try {
        res = await fetch('/api/admin/proximamente', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              activo: cardActiva,
              titulo: titulo.trim() || null,
              subtitulo: subtitulo.trim() || null,
              videoUrl: videoFinal,
              imagenUrl: imgCard?.url ?? null,
              imagenPublicId: imgCard?.publicId ?? null,
              enlaceTexto: enlaceTexto.trim() || null,
              enlaceUrl: enlace || null,
            },
            items: itemsGuardar,
          }),
        })
      } catch {
        throw new Error('Error de conexión')
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')

      // Las imágenes nuevas pasan a ser las guardadas
      if (imagenCard.nueva) URL.revokeObjectURL(imagenCard.nueva.preview)
      if (videoNuevo) {
        URL.revokeObjectURL(videoNuevo.preview)
        setVideoNuevo(null)
        setVideoSubido(null)
        if (videoFinal) setVideoUrl(videoFinal)
      }
      items.forEach((it) => {
        if (it.imagen.nueva) URL.revokeObjectURL(it.imagen.nueva.preview)
      })
      setImagenCard({ actual: imgCard, nueva: null, subida: null })
      setItems((prev) =>
        prev.map((it, i) => ({
          ...it,
          imagen: { actual: resueltas[i], nueva: null, subida: null },
        }))
      )
      setGuardado(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
      setProgreso('')
    }
  }

  const imagenCardMostrada = imagenCard.nueva?.preview ?? imagenCard.actual?.url ?? null

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {error && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 font-mono text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Card con video o imagen ── */}
      <section className="space-y-4 border border-primary/20 bg-surface p-4">
        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
            Card con video o imagen
          </h2>
          <p className="mt-1 font-mono text-xs text-muted">
            Es la primera card de la sección, a la izquierda de los productos. Si la desactivás,
            se muestran solo los productos.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={cardActiva}
            onChange={(e) => {
              setCardActiva(e.target.checked)
              marcarCambio()
            }}
            disabled={loading}
            className="h-4 w-4 accent-primary"
          />
          <span className="font-mono text-sm">Mostrar esta card</span>
        </label>

        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Imagen / portada */}
          <div className="flex-shrink-0">
            <div className="relative h-40 w-32 overflow-hidden border border-primary/20 bg-zinc-900">
              {imagenCardMostrada ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagenCardMostrada}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-zinc-400">
                  Sin imagen
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-col items-start gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-1.5 font-mono text-xs text-primary transition-colors hover:border-primary ${
                  loading ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <ImagePlus size={14} />
                {imagenCardMostrada ? 'Cambiar imagen' : 'Elegir imagen'}
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  disabled={loading}
                  onChange={(e) => {
                    elegirImagenCard(e.target.files?.[0])
                    e.target.value = ''
                  }}
                  className="hidden"
                />
              </label>

              {imagenCardMostrada && (
                <button
                  type="button"
                  onClick={quitarImagenCard}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  <X size={12} />
                  Quitar imagen
                </button>
              )}
            </div>

            {errorImagen?.key === 'card' && (
              <p className="mt-2 flex max-w-[8rem] items-start gap-1.5 font-mono text-xs text-red-500">
                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                {errorImagen.texto}
              </p>
            )}
          </div>

          {/* Datos */}
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label className={ETIQUETA}>Video (opcional)</label>

              <div className="mb-2 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-1.5 font-mono text-xs text-primary transition-colors hover:border-primary ${
                    loading ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <Video size={14} />
                  {videoNuevo || videoUrl ? 'Cambiar video' : 'Elegir video (MP4 / WebM)'}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    disabled={loading}
                    onChange={(e) => {
                      elegirVideo(e.target.files?.[0])
                      e.target.value = ''
                    }}
                    className="hidden"
                  />
                </label>

                {(videoNuevo || videoUrl) && (
                  <button
                    type="button"
                    onClick={quitarVideo}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    <X size={12} />
                    Quitar video
                  </button>
                )}
              </div>

              {errorImagen?.key === 'video' && (
                <p className="mb-2 flex items-start gap-1.5 font-mono text-xs text-red-500">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  {errorImagen.texto}
                </p>
              )}

              {(videoNuevo?.preview || /^https:\/\//i.test(videoUrl.trim())) && (
                <div className="mb-2 w-40 overflow-hidden border border-primary/20 bg-zinc-900">
                  <video
                    src={videoNuevo?.preview ?? videoUrl.trim()}
                    controls
                    muted
                    playsInline
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              )}

              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  if (videoNuevo) {
                    URL.revokeObjectURL(videoNuevo.preview)
                    setVideoNuevo(null)
                  }
                  setVideoUrl(e.target.value)
                  marcarCambio()
                }}
                disabled={loading}
                placeholder="O pegá una URL directa .mp4 (https://res.cloudinary.com/.../video.mp4)"
                className={INPUT}
              />
              <p className="mt-1 font-mono text-xs text-muted">
                Podés subir un MP4/WebM desde tu PC (hasta 25MB, sube directo a Cloudinary) o pegar
                la URL de un MP4. Conviene que sea corto (5 a 10s), sin sonido y vertical.
              </p>
            </div>

            <div>
              <label className={ETIQUETA}>Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  marcarCambio()
                }}
                maxLength={80}
                disabled={loading}
                placeholder="Ej: Nueva línea Attack Shark"
                className={INPUT}
              />
            </div>

            <div>
              <label className={ETIQUETA}>Subtítulo</label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => {
                  setSubtitulo(e.target.value)
                  marcarCambio()
                }}
                maxLength={160}
                disabled={loading}
                className={INPUT}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={ETIQUETA}>Texto del enlace</label>
                <input
                  type="text"
                  value={enlaceTexto}
                  onChange={(e) => {
                    setEnlaceTexto(e.target.value)
                    marcarCambio()
                  }}
                  maxLength={40}
                  disabled={loading}
                  placeholder="Ver más"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={ETIQUETA}>Enlace</label>
                <input
                  type="text"
                  value={enlaceUrl}
                  onChange={(e) => {
                    setEnlaceUrl(e.target.value)
                    marcarCambio()
                  }}
                  maxLength={300}
                  disabled={loading}
                  placeholder="/productos o https://..."
                  className={INPUT}
                />
              </div>
            </div>
            <p className="font-mono text-xs text-muted">
              Si cargás un enlace, toda la card se vuelve clickeable.
            </p>
          </div>
        </div>
      </section>

      {/* ── Productos próximos ── */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
            Productos próximos
          </h2>
          <p className="mt-1 font-mono text-xs text-muted">
            Cada card muestra el botón &quot;Avisame cuando llegue&quot;, que abre WhatsApp con el
            mensaje armado.
          </p>
        </div>

        {items.length === 0 && (
          <p className="border border-dashed border-primary/30 p-6 text-center font-mono text-xs text-muted">
            Todavía no hay productos. Mientras no haya ninguno activo, la sección no se muestra
            en la home.
          </p>
        )}

        <div className="space-y-4">
          {items.map((it, i) => {
            const imagenMostrada = it.imagen.nueva?.preview ?? it.imagen.actual?.url ?? null

            return (
              <div key={it.key} className="border border-primary/20 bg-surface p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                    Producto {String(i + 1).padStart(2, '0')}
                  </h3>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moverItem(it.key, -1)}
                      disabled={loading || i === 0}
                      aria-label="Subir producto"
                      className="p-1.5 text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverItem(it.key, 1)}
                      disabled={loading || i === items.length - 1}
                      aria-label="Bajar producto"
                      className="p-1.5 text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => quitarItem(it.key)}
                      disabled={loading}
                      aria-label="Quitar producto"
                      className="p-1.5 text-red-400 transition-colors hover:text-red-600 disabled:opacity-40"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Imagen */}
                  <div className="flex-shrink-0">
                    <div className="relative h-28 w-44 overflow-hidden border border-primary/20 bg-white">
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
                          elegirImagenItem(it.key, e.target.files?.[0])
                          e.target.value = ''
                        }}
                        className="hidden"
                      />
                    </label>

                    {errorImagen?.key === it.key && (
                      <p className="mt-2 flex max-w-[11rem] items-start gap-1.5 font-mono text-xs text-red-500">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        {errorImagen.texto}
                      </p>
                    )}
                  </div>

                  {/* Datos */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <label className={ETIQUETA}>Nombre *</label>
                      <input
                        type="text"
                        value={it.nombre}
                        onChange={(e) => actualizarItem(it.key, { nombre: e.target.value })}
                        maxLength={120}
                        disabled={loading}
                        className={INPUT}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={ETIQUETA}>Categoría</label>
                        <select
                          value={it.categoriaId}
                          onChange={(e) => actualizarItem(it.key, { categoriaId: e.target.value })}
                          disabled={loading}
                          className={INPUT}
                        >
                          <option value="">Sin categoría</option>
                          {categorias.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={ETIQUETA}>Marca</label>
                        <select
                          value={it.marcaId}
                          onChange={(e) => actualizarItem(it.key, { marcaId: e.target.value })}
                          disabled={loading}
                          className={INPUT}
                        >
                          <option value="">Sin marca</option>
                          {marcas.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={ETIQUETA}>Llegada estimada</label>
                        <input
                          type="text"
                          value={it.llegada}
                          onChange={(e) => actualizarItem(it.key, { llegada: e.target.value })}
                          maxLength={60}
                          disabled={loading}
                          placeholder="Ej: Diciembre"
                          className={INPUT}
                        />
                      </div>

                      <div>
                        <label className={ETIQUETA}>Precio estimado (opcional)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={it.precio}
                          onChange={(e) =>
                            actualizarItem(it.key, { precio: e.target.value.replace(/\D/g, '') })
                          }
                          disabled={loading}
                          placeholder="Ej: 85000"
                          className={INPUT}
                        />
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={it.activo}
                        onChange={(e) => actualizarItem(it.key, { activo: e.target.checked })}
                        disabled={loading}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="font-mono text-sm">Mostrar este producto en la home</span>
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
            onClick={agregarItem}
            disabled={loading || items.length >= MAX_ITEMS}
            className="inline-flex items-center gap-2 border border-primary/30 px-4 py-2 font-mono text-xs text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            Agregar producto
          </button>
          <span className="font-mono text-xs text-muted">
            {items.length} de {MAX_ITEMS}
          </span>
        </div>
      </section>

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
