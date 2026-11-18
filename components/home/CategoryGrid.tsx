import Link from 'next/link'

const CATEGORIAS = [
    { nombre: 'Teclados', slug: 'teclados', desc: 'Mecánicos y compactos' },
    { nombre: 'Auriculares', slug: 'auriculares', desc: 'Sonido y micrófono' },
    { nombre: 'Cables', slug: 'cables', desc: 'Coiled y personalizados' },
    { nombre: 'Controladoras', slug: 'controladoras', desc: 'Para PC' },
]

export function CategoryGrid() {
    return (
        <section className="container mx-auto px-4 py-16">
            <h2 className="mb-8 font-heading text-3xl font-bold uppercase md:text-4xl">
                Categorías
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {CATEGORIAS.map((cat) => (
                    <Link
                        key={cat.slug}
                        href={`/productos?categoria=${cat.slug}`}
                        className="product-card group block"
                    >
                        <div className="card-label">Categoría</div>
                        <div className="p-5">
                            <h3 className="font-heading text-xl font-bold uppercase transition-colors group-hover:text-primary md:text-2xl">
                                {cat.nombre}
                            </h3>
                            <p className="mt-1 font-mono text-xs text-secondary">{cat.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}