'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="MAT-X" width={64} height={64} className="mx-auto mb-3" />
          <p className="font-heading text-2xl font-bold uppercase tracking-widest">MAT-X</p>
          <p className="font-mono text-xs text-muted mt-1 uppercase tracking-widest">
            Panel de Administración
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-primary/20 p-6 space-y-4"
        >
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-wider block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-wider block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-500 bg-red-50 p-2">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="font-mono text-xs text-muted text-center mt-4">
          MAT-X Admin · Acceso restringido
        </p>
      </div>
    </div>
  )
}
