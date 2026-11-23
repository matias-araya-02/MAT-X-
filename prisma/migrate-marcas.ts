import * as dotenv from 'dotenv'
dotenv.config()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const limpiar = (s: string) => s.trim().replace(/\s+/g, ' ')
const normalizar = (s: string) => limpiar(s).toLowerCase()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function slugLibre(base: string): Promise<string> {
  const raiz = base || 'marca'
  let slug = raiz
  let n = 2
  while (await prisma.marca.findUnique({ where: { slug } })) {
    slug = `${raiz}-${n++}`
  }
  return slug
}

async function main() {
  const productos = await prisma.producto.findMany({
    where: { marcaTexto: { not: null }, marcaId: null },
    select: { id: true, marcaTexto: true },
  })

  // Agrupa por nombre normalizado (sin importar mayúsculas ni espacios).
  // El nombre que se muestra es la variante escrita más veces.
  const grupos = new Map<string, { variantes: Map<string, number>; ids: string[] }>()

  for (const p of productos) {
    const limpia = limpiar(p.marcaTexto ?? '')
    if (!limpia) continue
    const clave = normalizar(limpia)
    const grupo = grupos.get(clave) ?? { variantes: new Map<string, number>(), ids: [] as string[] }
    grupo.variantes.set(limpia, (grupo.variantes.get(limpia) ?? 0) + 1)
    grupo.ids.push(p.id)
    grupos.set(clave, grupo)
  }

  for (const grupo of grupos.values()) {
    const nombre = [...grupo.variantes.entries()].sort((a, b) => b[1] - a[1])[0][0]

    // Si ya existe (por ejemplo, si el script se corre dos veces), se reutiliza
    let marca = await prisma.marca.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    })
    if (!marca) {
      marca = await prisma.marca.create({
        data: { nombre, slug: await slugLibre(slugify(nombre)) },
      })
    }

    await prisma.producto.updateMany({
      where: { id: { in: grupo.ids } },
      data: { marcaId: marca.id },
    })

    console.log(`✔ ${marca.nombre} → ${grupo.ids.length} producto(s)`)
  }

  console.log('Listo.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
