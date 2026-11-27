'use client'

import { useEffect } from 'react'
import { useFavoritosStore } from '@/store/favoritos'

const KEY = 'mat-x-favoritos'

export function FavoritosSync() {
  useEffect(() => {
    const { persist } = useFavoritosStore

    Promise.resolve(persist.rehydrate()).then(() =>
      useFavoritosStore.setState({ hidratado: true })
    )

    // Cambios hechos desde otra pestaña
    function onStorage(e: StorageEvent) {
      if (e.key === KEY || e.key === null) persist.rehydrate()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return null
}
