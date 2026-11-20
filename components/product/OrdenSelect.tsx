'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const OPCIONES = [
    { valor: 'recientes', label: 'Más recientes' },
    { valor: 'precio-asc', label: 'Menor precio' },
    { valor: 'precio-desc', label: 'Mayor precio' },
]

export function OrdenSelect({ valor }: { valor: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()
    const [, startTransition] = useTransition()

    function cambiar(nuevo: string) {
        const next = new URLSearchParams(params.toString())
        if (nuevo === 'recientes') next.delete('orden')
        else next.set('orden', nuevo)
        const qs = next.toString()
        startTransition(() => {
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        })
    }

    return (
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
            Ordenar por
            <select
                value={valor}
                onChange={(e) => cambiar(e.target.value)}
                className="border border-primary/30 bg-background px-3 py-2 font-mono text-xs uppercase tracking-wider text-text focus:border-primary focus:outline-none"
            >
                {OPCIONES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    )
}