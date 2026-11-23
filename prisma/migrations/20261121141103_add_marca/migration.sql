-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "marcaId" TEXT;

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_slug_key" ON "Marca"("slug");

-- CreateIndex
CREATE INDEX "Producto_marcaId_idx" ON "Producto"("marcaId");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
