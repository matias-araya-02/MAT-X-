'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'

const CATEGORIAS = [
  { nombre: 'Teclados', slug: 'teclados' },
  { nombre: 'Auriculares', slug: 'auriculares' },
  { nombre: 'Cables', slug: 'cables' },
  { nombre: 'Controladoras', slug: 'controladoras' },
]

export function Navbar() {
  const { totalItems, openCart } = useCartStore()
  // Evitar hydration mismatch: el carrito vive en localStorage (solo cliente)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const cantidad = mounted ? totalItems() : 0

  return (
    <header className="bg-background sticky top-0 z-30">
      <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="MAT-X"
            width={48}
            height={48}
            priority
            unoptimized
          />
        </Link>

        {/* Categorías (desktop) */}
        <ul className="hidden md:flex items-center gap-8">
          {CATEGORIAS.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/productos?categoria=${cat.slug}`}
                className="font-sans font-medium text-base uppercase tracking-wider text-muted hover:text-text transition-colors"
              >
                {cat.nombre}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/productos"
              className="font-sans font-medium text-base uppercase tracking-wider text-muted hover:text-text transition-colors"
            >
              Todo
            </Link>
          </li>
        </ul>

        {/* Carrito */}
        <button
          onClick={openCart}
          className="relative p-2 hover:text-primary transition-colors"
          aria-label="Abrir carrito"
        >
          {/* TODO: Icono carrito (lucide-react o heroicons) */}
          <span className="font-mono text-xl">🛒</span>
          {cantidad > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cantidad}
            </span>
          )}
        </button>
      </nav>

    </header>
  )
}
