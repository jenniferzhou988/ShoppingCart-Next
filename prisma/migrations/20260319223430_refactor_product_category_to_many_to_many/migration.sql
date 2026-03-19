/*
  Warnings:

  - You are about to drop the column `productCategoryId` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productCategoryName]` on the table `ProductCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_productCategoryId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "productCategoryId";

-- CreateTable
CREATE TABLE "ProductCategoryLink" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "productCategoryId" INTEGER NOT NULL,

    CONSTRAINT "ProductCategoryLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategoryLink_productId_productCategoryId_key" ON "ProductCategoryLink"("productId", "productCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_productCategoryName_key" ON "ProductCategory"("productCategoryName");

-- AddForeignKey
ALTER TABLE "ProductCategoryLink" ADD CONSTRAINT "ProductCategoryLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategoryLink" ADD CONSTRAINT "ProductCategoryLink_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
