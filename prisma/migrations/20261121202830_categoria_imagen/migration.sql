/*
  Warnings:

  - You are about to drop the column `icono` on the `Categoria` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Categoria" DROP COLUMN "icono",
ADD COLUMN     "imagenPublicId" TEXT,
ADD COLUMN     "imagenUrl" TEXT;
