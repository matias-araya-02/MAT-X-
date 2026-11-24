'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Pantalla de carga de entrada: el símbolo MAT-X se dibuja, se rellena,
 * se mantiene y se desvanece. Se muestra una vez por visita (sessionStorage).
 * Se puede saltar con click, toque o cualquier tecla.
 *
 * Timing (del prompt original):
 *  - trazos escalonados cada 90ms, 2650ms cada uno
 *  - crossfade contorno -> relleno a los 3100ms durante 700ms
 *  - hold hasta 5000ms, fade del logo 5000-5600ms
 */

const STORAGE_KEY = 'matx-loader-seen'

// true: respeta la opción de accesibilidad del sistema.
// Puesto en false para que puedas ver la animación en tu compu con animaciones de Windows desactivadas.
const RESPETAR_MOVIMIENTO_REDUCIDO = false

const PATHS = [
  'M0 357.692V715.383L4.4 712.305C6.66667 710.485 39.6 684.736 77.3333 655.068C115.067 625.401 151.2 596.992 157.733 592.094L169.333 583.138V454.671C169.333 384.001 169.733 326.205 170.133 326.205C170.533 326.205 176.667 330.823 183.867 336.42C190.933 342.158 209.6 356.992 225.333 369.587C241.067 382.042 261.867 398.555 271.333 406.112C374.267 488.257 525.067 607.488 527.067 608.328C528.8 608.887 556.933 587.196 629.333 529.12C644.4 517.085 667.733 498.473 681.333 487.698C809.467 385.96 885.2 326.205 885.867 326.205C886.4 326.205 886.667 384.001 886.667 454.671V582.998L899.733 593.354C906.8 598.952 936 622.322 964.4 645.132C1048.93 712.864 1055.33 717.762 1056.4 717.063C1057.47 716.363 1057.6 2.37903 1056.53 1.11951C1055.47 0 1035.33 15.3936 917.333 108.035C859.067 153.796 791.2 206.974 766.667 226.146C742.133 245.318 678.667 295.277 625.6 337.12C567.467 382.881 528.4 412.829 527.2 412.409C526.133 411.989 466.933 365.808 395.733 309.692C324.4 253.715 256.4 200.257 244.667 191.161C232.933 181.924 180.4 140.782 128 99.6387C34.9333 26.589 13.2 9.65601 4.4 3.07874L0 0V357.692Z',
  'M210.8 5.31787C210.933 7.13712 284.933 72.3501 506.933 265.75C517.733 275.126 527.333 282.823 528.133 282.823C528.933 282.823 534.533 278.485 540.533 273.307C550.667 264.21 617.2 206.275 714.667 121.33C807.467 40.4433 845.067 6.99719 845.2 5.31787C845.333 4.75812 702.533 4.33829 528 4.33829C353.467 4.33829 210.667 4.75812 210.8 5.31787Z',
  'M248 579.08V661.506L225.067 679.418C212.4 689.214 156.533 733.016 101.067 776.538L0 855.885V955.524V1055.3L9.73333 1048.03C14.9333 1044.11 31.3333 1031.65 46 1020.6C77.3333 996.667 96.1333 982.392 149.333 941.949C170.933 925.436 199.2 904.025 212 894.369C224.8 884.573 256.4 860.503 282.133 841.051C308 821.459 344.667 793.611 363.733 779.197C382.933 764.643 407.733 745.471 418.933 736.654C430.133 727.838 449.733 712.304 462.4 702.369C475.067 692.293 485.333 684.036 485.067 683.896C484.8 683.616 472.4 673.82 457.333 661.925C442.267 649.89 398.267 615.045 359.333 584.398C320.533 553.75 281.467 522.823 272.667 515.826C263.867 508.829 254.667 501.692 252.4 499.873L248 496.794V579.08Z',
  'M741.333 549.132C598.933 661.506 572 683.057 572 684.456C572 685.016 573.6 686.695 575.733 688.095C577.733 689.494 594.667 702.928 613.333 718.042C664.133 759.045 738.533 816.981 855.333 906.404C1034.4 1043.69 1054.13 1058.52 1056.13 1057.26C1056.93 1056.84 1057.33 1015.7 1057.33 956.783L1057.2 857.144L952.933 775.138C895.6 730.077 839.733 686.135 828.667 677.599L808.667 661.925L808 579.5L807.333 497.074L741.333 549.132Z',
  'M508 786.334C450.133 830.975 329.467 926.416 273.333 971.897C251.733 989.39 221.867 1013.6 206.933 1025.63L179.867 1047.61L353.867 1048.03C449.733 1048.17 606.267 1048.17 702 1048.03L876 1047.61L828.4 1009.12C736.8 934.952 709.6 913.261 652 867.92C587.6 817.121 528.533 771.22 527.867 771.22C527.6 771.36 518.667 778.077 508 786.334Z',
]

const COLOR = '#7C3AED'
const STAGGER = [0, 75, 150, 225, 300]
const DRAW_MS = 2100
const FILL_AT = 2400
const FILL_MS = 450
const FADE_AT = 3100
const TOTAL_MS = 3500
const EXIT_MS = 300

const ease = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, v)))

export function LogoLoader() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  const strokeRefs = useRef<(SVGPathElement | null)[]>([])
  const outlineGroup = useRef<SVGGElement>(null)
  const fillGroup = useRef<SVGGElement>(null)
  const logoGroup = useRef<SVGGElement>(null)

  useEffect(() => {
    // Ya visto en esta visita: no mostrar
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(false)
        return
      }
    } catch {
      /* storage no disponible: se muestra igual */
    }

    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    const paths = strokeRefs.current.filter(Boolean) as SVGPathElement[]
    const lengths = paths.map((p) => p.getTotalLength())
    paths.forEach((p, i) => {
      p.style.strokeDasharray = `${lengths[i]}`
      p.style.strokeDashoffset = `${lengths[i]}`
    })

    const render = (t: number) => {
      paths.forEach((p, i) => {
        const v = ease((t - STAGGER[i]) / DRAW_MS)
        p.style.strokeDashoffset = `${lengths[i] * (1 - v)}`
      })
      const f = ease((t - FILL_AT) / FILL_MS)
      if (outlineGroup.current) outlineGroup.current.style.opacity = `${t < FILL_AT ? 1 : 1 - f}`
      if (fillGroup.current) fillGroup.current.style.opacity = `${f}`
      if (logoGroup.current) {
        logoGroup.current.style.opacity = `${t > FADE_AT ? 1 - ease((t - FADE_AT) / (TOTAL_MS - FADE_AT)) : 1}`
      }
    }

    let raf = 0
    let last: number | null = null
    let elapsed = 0
    let finished = false
    let exitTimer: ReturnType<typeof setTimeout> | undefined
    let reducedTimer: ReturnType<typeof setTimeout> | undefined

    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      html.style.overflow = prevOverflow
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignorar */
      }
      setLeaving(true)
      exitTimer = setTimeout(() => setVisible(false), EXIT_MS)
    }

    const frame = (now: number) => {
      if (finished) return
      if (last !== null) elapsed += now - last
      last = now
      render(elapsed)
      if (elapsed >= TOTAL_MS) {
        finish()
        return
      }
      raf = requestAnimationFrame(frame)
    }

    const onVisibility = () => {
      if (finished) return
      if (document.hidden) {
        cancelAnimationFrame(raf)
        last = null // no acumular el tiempo suspendido
      } else {
        raf = requestAnimationFrame(frame)
      }
    }

    const reduceMotion =
      RESPETAR_MOVIMIENTO_REDUCIDO &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      render(FADE_AT - 1) // logo completo y relleno, sin trazo
      reducedTimer = setTimeout(finish, 900)
    } else {
      render(0)
      raf = requestAnimationFrame(frame)
      document.addEventListener('visibilitychange', onVisibility)
    }

    window.addEventListener('pointerdown', finish)
    window.addEventListener('keydown', finish)

    return () => {
      finished = true
      cancelAnimationFrame(raf)
      clearTimeout(exitTimer)
      clearTimeout(reducedTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointerdown', finish)
      window.removeEventListener('keydown', finish)
      html.style.overflow = prevOverflow
    }
  }, [])

  if (!visible) return null

  return (
    <>
      <div
        id="matx-loader"
        role="status"
        aria-label="Cargando MAT-X"
        suppressHydrationWarning
        className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
        style={{
          opacity: leaving ? 0 : 1,
          pointerEvents: leaving ? 'none' : 'auto',
          transition: `opacity ${EXIT_MS}ms ease`,
        }}
      >
        <svg
          viewBox="-10 -10 1078 1078"
          aria-hidden="true"
          focusable="false"
          style={{ width: 'clamp(96px, 18vw, 150px)', height: 'auto', overflow: 'visible' }}
        >
          <g ref={logoGroup}>
            <g ref={fillGroup} style={{ opacity: 0 }}>
              {PATHS.map((d, i) => (
                <path key={i} d={d} fill={COLOR} />
              ))}
            </g>
            <g ref={outlineGroup} style={{ opacity: 0 }}>
              {PATHS.map((d, i) => (
                <path
                  key={i}
                  ref={(el) => {
                    strokeRefs.current[i] = el
                  }}
                  d={d}
                  fill="none"
                  stroke={COLOR}
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </g>
          </g>
        </svg>
      </div>
      {/* Visitas repetidas: se oculta antes de hidratar para evitar el parpadeo */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem('${STORAGE_KEY}')){var e=document.getElementById('matx-loader');if(e)e.style.display='none'}}catch(_){}`,
        }}
      />
      {/* Sin JS no hay forma de cerrarlo: se oculta */}
      <noscript>
        <style>{'#matx-loader{display:none!important}'}</style>
      </noscript>
    </>
  )
}
