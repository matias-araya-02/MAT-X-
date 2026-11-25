'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useHeroSync } from './HeroSync'

// true:  respeta "reducir movimiento" del sistema (el título aparece completo, sin animar).
//        Es lo recomendable para producción.
// false: siempre se anima, aunque el sistema tenga ese ajuste (útil para probar).
const RESPETAR_MOVIMIENTO_REDUCIDO = false

// ── Tiempos ───────────────────────────────────────────────────────────────
const DURACION_MS = 1250 // cada línea, en el efecto de puntos
const DESFASE_LINEAS_MS = 160 // retraso entre una línea y la siguiente
const DURACION_DIAGONAL_MS = 900 // barrido simple (celulares, tablets, títulos chicos)

// ── Detalles del efecto ───────────────────────────────────────────────────
const UMBRAL_VISIBILIDAD = 0.15 // parte del título que tiene que verse para arrancar
const FUENTE_MIN_PUNTOS = 64 // por debajo de este tamaño (px) se usa el barrido simple
const DPR_MAX = 2
const NIVELES_COLOR = 32
const COLOR_INICIAL = [46, 43, 51] as const // gris oscuro del que nacen los puntos

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

type Fase = 'previo' | 'puntos' | 'diagonal' | 'listo'
type Modo = 'puntos' | 'diagonal'

interface Puntos {
  W: number // ancho CSS del lienzo
  H: number // alto CSS del lienzo (con relleno arriba y abajo)
  cell: number
  dpr: number
  n: number
  x: Float32Array
  y: Float32Array
  fase: Float32Array
  colores: string[]
}

interface LineaRT {
  live: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null
  puntos: Puntos | null
  ancho: number
  alto: number
}

interface Linea {
  texto: string
  className?: string
}

interface Props {
  lineas: Linea[]
  /** Frase completa para lectores de pantalla */
  etiqueta: string
  className?: string
}

const ESTILOS = `
.ht .ht-ghost { opacity: 0; }
.ht[data-fase="diagonal"] .ht-ghost { opacity: 0.3; }
.ht .ht-canvas { display: none; }
.ht[data-fase="puntos"] .ht-canvas { display: block; }
.ht[data-fase="previo"] .ht-live {
  visibility: hidden;
  animation: ht-respaldo 0s linear 3s forwards;
}
@keyframes ht-respaldo { to { visibility: visible; } }
`

const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

// power1.inOut
const power1InOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

// Números pseudoaleatorios con semilla: la animación se repite igual cada vez
function mulberry32(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Recorte diagonal del texto real. q = 0: oculto · q = 1: sin recorte.
function clipSolido(q: number) {
  if (q >= 1) return ''
  const a = (118 * q).toFixed(2)
  const b = (118 * q - 18).toFixed(2)
  return `polygon(0% -15%, ${a}% -15%, ${b}% 115%, 0% 115%)`
}

// Mide cada letra del texto real, la dibuja en un lienzo oculto y arma la grilla de puntos
function construirPuntos(l: LineaRT, indice: number): Puntos | null {
  const { live, canvas } = l

  const rect = live.getBoundingClientRect()
  l.ancho = rect.width
  l.alto = rect.height

  const cs = getComputedStyle(live)
  const fontSize = parseFloat(cs.fontSize)
  if (!(fontSize >= FUENTE_MIN_PUNTOS)) return null
  if (rect.width < 1 || rect.height < 1) return null
  // Si el título se partió en varias líneas, el efecto de puntos no aplica
  if (rect.height > fontSize * 1.6) return null

  const nodo = live.firstChild
  if (!nodo || nodo.nodeType !== Node.TEXT_NODE) return null
  const texto = nodo.textContent ?? ''

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX)
  const relleno = rect.height * 0.18
  const W = rect.width
  const H = rect.height + relleno * 2
  const cell = Math.max(2.4, fontSize / 44)

  // Línea base: una sonda de tamaño cero apoyada sobre la línea base del texto
  const sonda = document.createElement('span')
  sonda.style.cssText = 'display:inline-block;width:0;height:0;'
  live.appendChild(sonda)
  const baseline = sonda.getBoundingClientRect().bottom
  live.removeChild(sonda)

  // Lienzo oculto con el texto dibujado letra por letra, en la posición medida
  const fuera = document.createElement('canvas')
  fuera.width = Math.ceil(W * dpr)
  fuera.height = Math.ceil(H * dpr)
  const octx = fuera.getContext('2d', { willReadFrequently: true })
  if (!octx) return null

  octx.scale(dpr, dpr)
  octx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`
  octx.textBaseline = 'alphabetic'
  octx.fillStyle = cs.color

  const transformar = cs.textTransform
  const rango = document.createRange()
  const yBase = baseline - (rect.top - relleno)

  for (let i = 0; i < texto.length; i++) {
    let ch = texto[i]
    if (ch.trim() === '') continue
    if (transformar === 'uppercase') {
      const u = ch.toUpperCase()
      if (u.length === 1) ch = u
    } else if (transformar === 'lowercase') {
      const m = ch.toLowerCase()
      if (m.length === 1) ch = m
    }
    rango.setStart(nodo, i)
    rango.setEnd(nodo, i + 1)
    const r = rango.getBoundingClientRect()
    octx.fillText(ch, r.left - rect.left, yBase)
  }

  // Grilla de muestras: se conservan las celdas donde la letra es opaca
  const datos = octx.getImageData(0, 0, fuera.width, fuera.height).data
  const rand = mulberry32(1234 + indice * 7919)
  const xs: number[] = []
  const ys: number[] = []
  const fs: number[] = []
  let color: [number, number, number] | null = null
  let colorOpaco = false

  for (let y = cell / 2; y < H; y += cell) {
    const py = Math.min(fuera.height - 1, Math.floor(y * dpr))
    for (let x = cell / 2; x < W; x += cell) {
      const px = Math.min(fuera.width - 1, Math.floor(x * dpr))
      const idx = (py * fuera.width + px) * 4
      const alfa = datos[idx + 3]
      if (alfa <= 128) continue

      if (!color || (!colorOpaco && alfa === 255)) {
        color = [datos[idx], datos[idx + 1], datos[idx + 2]]
        colorOpaco = alfa === 255
      }

      xs.push(x)
      ys.push(y)
      fs.push(((x + 0.18 * W * (y / H)) / (1.18 * W)) * 0.8 + 0.1 * rand())
    }
  }

  if (!color || xs.length === 0) return null

  // Cada línea es de un solo color: se precalculan los niveles de la mezcla
  const [r0, g0, b0] = COLOR_INICIAL
  const [r, g, b] = color
  const colores = Array.from({ length: NIVELES_COLOR + 1 }, (_, k) => {
    const t = k / NIVELES_COLOR
    return `rgb(${Math.round(r0 + (r - r0) * t)}, ${Math.round(g0 + (g - g0) * t)}, ${Math.round(
      b0 + (b - b0) * t
    )})`
  })

  // El lienzo visible mide lo mismo que el texto, con el relleno arriba y abajo
  canvas.width = fuera.width
  canvas.height = fuera.height
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`
  canvas.style.top = `${-relleno}px`

  return {
    W,
    H,
    cell,
    dpr,
    n: xs.length,
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    fase: Float32Array.from(fs),
    colores,
  }
}

function limpiarCanvas(l: LineaRT) {
  if (!l.ctx) return
  l.ctx.setTransform(1, 0, 0, 1, 0, 0)
  l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height)
  l.ctx.globalAlpha = 1
}

// Dibuja los puntos de una línea según su progreso p (ya con la curva aplicada)
function dibujar(l: LineaRT, p: number) {
  const pts = l.puntos
  const ctx = l.ctx
  if (!pts || !ctx) return

  ctx.setTransform(pts.dpr, 0, 0, pts.dpr, 0, 0)
  ctx.clearRect(0, 0, pts.W, pts.H)
  ctx.globalAlpha = 1

  // Última parte: el texto real reemplaza a los puntos con un frente diagonal
  const q = limitar((p - 0.74) / 0.24)
  if (q >= 1) return

  const progreso = Math.min(p / 0.68, 1)
  const base = -12 + q * (1.18 * pts.W + 12)
  const inclinacion = (0.18 * pts.W) / pts.H
  let nivelActual = -1

  for (let i = 0; i < pts.n; i++) {
    const llegada = limitar((progreso - pts.fase[i]) / 0.1)
    if (llegada <= 0) continue

    const x = pts.x[i]
    const y = pts.y[i]
    const frente = base - inclinacion * y
    const alfa = llegada * limitar((x - frente) / 10)
    if (alfa < 0.004) continue

    const nivel = Math.round(Math.min(1, 0.3 + 0.7 * llegada) * NIVELES_COLOR)
    if (nivel !== nivelActual) {
      ctx.fillStyle = pts.colores[nivel]
      nivelActual = nivel
    }

    ctx.globalAlpha = alfa
    ctx.beginPath()
    ctx.arc(x, y, pts.cell * (0.086 + 0.093 * llegada), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

export function HeroTitle({ lineas: textos, etiqueta, className }: Props) {
  const rootRef = useRef<HTMLHeadingElement>(null)
  const [fase, setFase] = useState<Fase>('previo')
  const { marcarTituloListo } = useHeroSync()

  const marcarRef = useRef(marcarTituloListo)
  marcarRef.current = marcarTituloListo

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const lineas = Array.from(root.querySelectorAll<HTMLElement>('[data-linea]')).flatMap<LineaRT>(
      (wrap) => {
        const live = wrap.querySelector<HTMLElement>('[data-live]')
        const canvas = wrap.querySelector<HTMLCanvasElement>('canvas')
        if (!live || !canvas) return []
        return [{ live, canvas, ctx: canvas.getContext('2d'), puntos: null, ancho: 0, alto: 0 }]
      }
    )

    let cancelado = false
    let raf = 0
    let iniciado = false
    let terminado = false
    let fuentesListas = false
    let visibleEnPantalla = false
    let pestanaVisible = document.visibilityState === 'visible'
    let transcurrido = 0
    let ultimo = 0
    let temporizadorReconstruccion = 0
    let modo: Modo = 'diagonal'
    let total = 0

    const mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)')
    const respetaReducido = () => RESPETAR_MOVIMIENTO_REDUCIDO && mqReducido.matches

    // Muestra el título completo, sin animación
    function mostrarCompleto() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      terminado = true
      for (const l of lineas) {
        l.live.style.clipPath = ''
        limpiarCanvas(l)
      }
      setFase('listo')
      marcarRef.current()
    }

    if (lineas.length === 0 || respetaReducido()) {
      mostrarCompleto()
      return () => {
        cancelado = true
      }
    }

    // Capacidad real del dispositivo (no el user agent): mouse con hover y título grande
    const conHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const fuente = parseFloat(getComputedStyle(lineas[0].live).fontSize)
    modo = conHover && fuente >= FUENTE_MIN_PUNTOS ? 'puntos' : 'diagonal'

    const duracion = modo === 'puntos' ? DURACION_MS : DURACION_DIAGONAL_MS
    total = duracion + (lineas.length - 1) * DESFASE_LINEAS_MS

    // Estado inicial antes del primer dibujo: texto recortado (invisible)
    for (const l of lineas) l.live.style.clipPath = clipSolido(0)
    setFase(modo)

    function construirTodo() {
      lineas.forEach((l, i) => {
        l.puntos = modo === 'puntos' ? construirPuntos(l, i) : null
      })
    }

    function render(t: number) {
      lineas.forEach((l, i) => {
        const lineal = limitar((t - i * DESFASE_LINEAS_MS) / duracion)
        const p = power1InOut(lineal)

        if (modo === 'puntos' && l.puntos) {
          dibujar(l, p)
          l.live.style.clipPath = clipSolido(limitar((p - 0.74) / 0.24))
        } else {
          l.live.style.clipPath = clipSolido(p)
        }
      })
    }

    function terminar() {
      terminado = true
      raf = 0
      for (const l of lineas) {
        l.live.style.clipPath = ''
        limpiarCanvas(l)
      }
      setFase('listo')
      marcarRef.current()
    }

    // Reloj activo: solo avanza mientras se está reproduciendo
    function tick(ahora: number) {
      raf = 0
      transcurrido += Math.min(Math.max(0, ahora - ultimo), 200)
      ultimo = ahora

      if (transcurrido >= total) {
        render(total)
        terminar()
        return
      }

      render(transcurrido)
      raf = requestAnimationFrame(tick)
    }

    function reanudar() {
      if (!iniciado || terminado || raf) return
      if (!visibleEnPantalla || !pestanaVisible) return
      ultimo = performance.now()
      raf = requestAnimationFrame(tick)
    }

    function pausar() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    function actualizarReproduccion() {
      if (visibleEnPantalla && pestanaVisible) reanudar()
      else pausar()
    }

    function iniciar() {
      iniciado = true
      transcurrido = 0
      if (modo === 'puntos') construirTodo()
      render(0)
      reanudar()
    }

    function intentarIniciar() {
      if (iniciado || terminado || !fuentesListas || !visibleEnPantalla) return
      iniciar()
    }

    // Reconstruye los puntos (cambio de tamaño o fuente) sin reiniciar el progreso
    function programarReconstruccion() {
      window.clearTimeout(temporizadorReconstruccion)
      temporizadorReconstruccion = window.setTimeout(() => {
        if (cancelado || terminado || !iniciado) return
        construirTodo()
        render(transcurrido)
      }, 80)
    }

    const io = new IntersectionObserver(
      (entradas) => {
        visibleEnPantalla = entradas[entradas.length - 1].isIntersecting
        intentarIniciar()
        actualizarReproduccion()
      },
      { threshold: UMBRAL_VISIBILIDAD }
    )
    io.observe(root)

    const ro = new ResizeObserver(() => {
      if (!iniciado || terminado || modo !== 'puntos') return
      const cambio = lineas.some((l) => {
        const r = l.live.getBoundingClientRect()
        return Math.abs(r.width - l.ancho) > 0.5 || Math.abs(r.height - l.alto) > 0.5
      })
      if (cambio) programarReconstruccion()
    })
    lineas.forEach((l) => ro.observe(l.live))

    const onVisibilidad = () => {
      pestanaVisible = document.visibilityState === 'visible'
      actualizarReproduccion()
    }
    document.addEventListener('visibilitychange', onVisibilidad)

    const onFuentes = () => {
      if (iniciado && !terminado && modo === 'puntos') programarReconstruccion()
    }
    document.fonts.addEventListener('loadingdone', onFuentes)

    const onReducido = () => {
      if (respetaReducido() && !terminado) mostrarCompleto()
    }
    mqReducido.addEventListener('change', onReducido)

    // Esperar a que la fuente del título esté cargada antes de medir
    async function esperarFuentes() {
      try {
        const cargas = lineas.map((l) => {
          const cs = getComputedStyle(l.live)
          return document.fonts.load(
            `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
            l.live.textContent ?? ''
          )
        })
        await Promise.race([
          Promise.all(cargas).then(() => document.fonts.ready),
          new Promise((resolver) => window.setTimeout(resolver, 2500)),
        ])
      } catch {
        /* si falla se sigue con la fuente disponible */
      }
    }

    void esperarFuentes().then(() => {
      if (cancelado) return
      fuentesListas = true
      intentarIniciar()
    })

    return () => {
      cancelado = true
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(temporizadorReconstruccion)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibilidad)
      document.fonts.removeEventListener('loadingdone', onFuentes)
      mqReducido.removeEventListener('change', onReducido)
    }
  }, [])

  return (
    <>
      <style>{ESTILOS}</style>
      <noscript>
        <style>{`.ht .ht-live { visibility: visible !important; animation: none !important; }`}</style>
      </noscript>

      <h1 ref={rootRef} aria-label={etiqueta} data-fase={fase} className={`ht ${className ?? ''}`}>
        {textos.map((linea, i) => (
          <span
            key={i}
            data-linea
            className={`relative block w-fit max-w-full ${linea.className ?? ''}`}
          >
            {/* Versión tenue del texto: solo se ve en el barrido simple */}
            <span
              data-ghost
              aria-hidden="true"
              className="ht-ghost pointer-events-none absolute inset-0 select-none"
            >
              {linea.texto}
            </span>

            {/* Texto real: queda seleccionable al terminar */}
            <span data-live aria-hidden="true" className="ht-live relative block">
              {linea.texto}
            </span>

            {/* Puntos (solo en el efecto completo) */}
            <canvas
              aria-hidden="true"
              className="ht-canvas pointer-events-none absolute left-0"
            />
          </span>
        ))}
      </h1>
    </>
  )
}
