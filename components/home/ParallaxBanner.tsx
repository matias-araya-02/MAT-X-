import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ParallaxImage } from '@/components/home/ParallaxImage'

interface Banner {
  imagenUrl: string
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
  banner: Banner | null
}

export function ParallaxBanner({ banner }: Props) {
  if (!banner) return null

  const {
    imagenUrl,
    overlay,
    altura,
    intensidad,
    anchoCompleto,
    titulo,
    subtitulo,
    botonTexto,
    botonUrl,
  } = banner
  const hayBoton = !!(botonTexto && botonUrl)
  const hayTexto = !!(titulo || subtitulo || hayBoton)

  const seccion = (
    <section
      className="relative h-[calc(var(--alto)*0.75)] w-full overflow-hidden bg-zinc-900 md:h-[var(--alto)]"
      style={{ '--alto': `${altura}px` } as CSSProperties}
    >
      <ParallaxImage src={imagenUrl} intensidad={intensidad} />

      {/* Capa oscura */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black"
        style={{ opacity: overlay / 100 }}
      />

      {hayTexto && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-4 text-center text-white">
          {titulo && (
            <h2 className="max-w-3xl font-heading text-3xl font-bold uppercase md:text-5xl">
              {titulo}
            </h2>
          )}
          {subtitulo && (
            <p className="max-w-2xl font-mono text-sm text-white/85 md:text-base">{subtitulo}</p>
          )}
          {hayBoton && (
            <Link href={botonUrl!} className="btn-primary mt-2 px-8">
              {botonTexto}
            </Link>
          )}
        </div>
      )}
    </section>
  )

  // Alineado con el resto de las secciones, o de borde a borde
  if (anchoCompleto) return seccion
  return <div className="mx-auto w-full max-w-7xl px-4">{seccion}</div>
}
