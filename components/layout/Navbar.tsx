'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'
import { Menu, X } from 'lucide-react'
import { FavoritosMenu } from './FavoritosMenu'
import { PixelCart } from './PixelCart'

const CATEGORIAS = [
  { nombre: 'Teclados', slug: 'teclados' },
  { nombre: 'Auriculares', slug: 'auriculares' },
  { nombre: 'Cables', slug: 'cables' },
  { nombre: 'Controladoras', slug: 'controladoras' },
]

export function Navbar() {
  const { totalItems, openCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  const cantidad = mounted ? totalItems() : 0

  return (
    <header className="bg-background sticky top-0 z-30">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="MAT-X"
            width={40}
            height={40}
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
                className="font-sans font-medium text-sm uppercase tracking-wider text-muted hover:text-primary transition-colors"
              >
                {cat.nombre}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/productos"
              className="font-sans font-medium text-sm uppercase tracking-wider text-muted hover:text-primary transition-colors"
            >
              Todo
            </Link>
          </li>
        </ul>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <FavoritosMenu />

          {/* Carrito */}
          <button
            onClick={openCart}
            className="relative flex items-center justify-center p-2 text-muted transition-colors hover:text-primary"
            aria-label="Abrir carrito"
          >
            <PixelCart size={22} />
            {cantidad > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-primary px-1 font-sans text-[10px] font-bold leading-none tabular-nums text-white">
                {cantidad}
              </span>
            )}
          </button>

          {/* Hamburguesa (mobile) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-muted hover:text-primary transition-colors"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-primary/10 bg-background">
          <ul className="mx-auto w-full max-w-7xl space-y-1 px-4 py-4">
            {CATEGORIAS.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/productos?categoria=${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 font-sans font-medium text-sm uppercase tracking-wider text-muted hover:text-primary hover:bg-surface transition-colors"
                >
                  {cat.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/productos"
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-3 font-sans font-medium text-sm uppercase tracking-wider text-muted hover:text-primary hover:bg-surface transition-colors"
              >
                Ver todo
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
