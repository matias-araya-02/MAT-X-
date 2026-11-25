'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// Coordina el hero: el producto de la derecha no empieza a rotar hasta que
// el título termina de animarse.

interface HeroSyncValue {
  tituloListo: boolean
  marcarTituloListo: () => void
}

// Fuera de un proveedor se considera "listo" para que HeroShowcase funcione solo
const HeroSyncContext = createContext<HeroSyncValue>({
  tituloListo: true,
  marcarTituloListo: () => {},
})

// Si por algún motivo el título nunca avisa, la rotación arranca igual pasado este tiempo
const ESPERA_MAXIMA_MS = 4500

export function HeroSyncProvider({ children }: { children: ReactNode }) {
  const [tituloListo, setTituloListo] = useState(false)

  const marcarTituloListo = useCallback(() => setTituloListo(true), [])

  useEffect(() => {
    const id = window.setTimeout(() => setTituloListo(true), ESPERA_MAXIMA_MS)
    return () => window.clearTimeout(id)
  }, [])

  const valor = useMemo(
    () => ({ tituloListo, marcarTituloListo }),
    [tituloListo, marcarTituloListo]
  )

  return <HeroSyncContext.Provider value={valor}>{children}</HeroSyncContext.Provider>
}

export function useHeroSync() {
  return useContext(HeroSyncContext)
}
