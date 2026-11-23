-- CreateTable
CREATE TABLE "DestacadoHome" (
    "id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "imagenPublicId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestacadoHome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestacadoHome_orden_key" ON "DestacadoHome"("orden");

-- CreateIndex
CREATE INDEX "DestacadoHome_productoId_idx" ON "DestacadoHome"("productoId");

-- AddForeignKey
ALTER TABLE "DestacadoHome" ADD CONSTRAINT "DestacadoHome_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
