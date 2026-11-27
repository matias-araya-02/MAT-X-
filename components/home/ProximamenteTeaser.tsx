'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export interface ProximamenteTeaserData {
  videoUrl: string | null
  imagenUrl: string | null
  titulo: string | null
  subtitulo: string | null
  enlaceUrl: string | null
  enlaceTexto: string | null
}

// true:  respeta "reducir movimiento" del sistema (no carga ni reproduce el video; queda la imagen).
//        Es lo recomendable para producción.
// false: reproduce siempre (útil para probar).
const RESPETAR_MOVIMIENTO_REDUCIDO = false

// El video empieza a descargarse un poco antes de llegar a la pantalla
const MARGEN_PRECARGA = '300px'
// Parte de la card que tiene que verse para que el video se reproduzca
const UMBRAL_REPRODUCCION = 0.35

type InfoConexion = { saveData?: boolean; effectiveType?: string }

// Ahorro de datos o conexión muy lenta: no se descarga el video
function conexionLimitada() {
  const c = (navigator as Navigator & { connection?: InfoConexion }).connection
  return Boolean(c?.saveData) || c?.effectiveType === 'slow-2g' || c?.effectiveType === '2g'
}

const esExterno = (url: string) => /^https?:\/\//i.test(url)

export function ProximamenteTeaser({
  videoUrl,
  imagenUrl,
  titulo,
  subtitulo,
  enlaceUrl,
  enlaceTexto,
}: ProximamenteTeaserData) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [cerca, setCerca] = useState(false)
  const [enPantalla, setEnPantalla] = useState(false)
  const [pestanaVisible, setPestanaVisible] = useState(true)
  const [reducido, setReducido] = useState(false)
  const [ahorro, setAhorro] = useState(false)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [fallo, setFallo] = useState(false)

  const hayVideo = Boolean(videoUrl) && !fallo
  const permitido = !(RESPETAR_MOVIMIENTO_REDUCIDO && reducido) && !ahorro
  const mostrarVideo = hayVideo && permitido
  const debeReproducir = mostrarVideo && enPantalla && pestanaVisible

  // Preferencia de "reducir movimiento" (y cambios mientras la página está abierta)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const actualizar = () => setReducido(mq.matches)
    actualizar()
    mq.addEventListener('change', actualizar)
    return () => mq.removeEventListener('change', actualizar)
  }, [])

  useEffect(() => {
    setAhorro(conexionLimitada())
  }, [])

  // Pausa cuando la pestaña no está visible
  useEffect(() => {
    const actualizar = () => setPestanaVisible(document.visibilityState === 'visible')
    actualizar()
    document.addEventListener('visibilitychange', actualizar)
    return () => document.removeEventListener('visibilitychange', actualizar)
  }, [])

  // Empieza a cargar el video cuando la card está cerca de verse
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCerca(true)
          io.disconnect()
        }
      },
      { rootMargin: MARGEN_PRECARGA }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Reproduce solo mientras se ve
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setEnPantalla(entry.isIntersecting), {
      threshold: UMBRAL_REPRODUCCION,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (debeReproducir && cerca) {
      const promesa = video.play()
      if (promesa) promesa.catch(() => {})
    } else {
      video.pause()
    }
  }, [debeReproducir, cerca, mostrarVideo])

  const etiquetaEnlace = enlaceTexto || titulo || 'Ver más'
  const hayTexto = Boolean(titulo || subtitulo || (enlaceUrl && enlaceTexto))

  return (
    <div
      ref={rootRef}
      className="relative isolate aspect-[4/5] w-full overflow-hidden bg-zinc-900 sm:aspect-[16/9] lg:aspect-auto lg:min-h-[320px] lg:flex-1"
    >
      {/* Imagen: portada del video, o imagen ilustrativa si no hay video */}
      {imagenUrl && (
        <Image
          src={imagenUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 25vw"
          className="object-cover"
        />
      )}

      {/* Video (solo se descarga cuando está cerca y el dispositivo lo permite) */}
      {mostrarVideo && (
        <video
          ref={videoRef}
          src={cerca ? (videoUrl ?? undefined) : undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          disablePictureInPicture
          onPlaying={() => setReproduciendo(true)}
          onError={() => setFallo(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            reproduciendo ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Degradado para que el texto se lea */}
      {hayTexto && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
        />
      )}

      {/* Texto */}
      {hayTexto && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 text-center text-white">
          {titulo && (
            <p className="font-heading text-2xl font-bold uppercase tracking-wider">{titulo}</p>
          )}
          {subtitulo && <p className="mt-1 font-mono text-xs text-white/80">{subtitulo}</p>}
          {enlaceUrl && enlaceTexto && (
            <p className="mt-3 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest">
              {enlaceTexto}
              <ArrowUpRight size={14} aria-hidden="true" />
            </p>
          )}
        </div>
      )}

      {/* Enlace: toda la card es clickeable */}
      {enlaceUrl &&
        (esExterno(enlaceUrl) ? (
          <a
            href={enlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={etiquetaEnlace}
            className="absolute inset-0 z-20 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
          />
        ) : (
          <Link
            href={enlaceUrl}
            aria-label={etiquetaEnlace}
            className="absolute inset-0 z-20 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
          />
        ))}
    </div>
  )
}
