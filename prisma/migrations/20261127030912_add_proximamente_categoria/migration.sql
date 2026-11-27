-- AlterTable
ALTER TABLE "ProximoIngreso" ADD COLUMN     "categoriaId" TEXT;

-- CreateIndex
CREATE INDEX "ProximoIngreso_categoriaId_idx" ON "ProximoIngreso"("categoriaId");

-- AddForeignKey
ALTER TABLE "ProximoIngreso" ADD CONSTRAINT "ProximoIngreso_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
