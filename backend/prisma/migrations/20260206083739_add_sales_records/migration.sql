-- CreateTable
CREATE TABLE "SalesRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesItem" (
    "id" UUID NOT NULL,
    "salesRecordId" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "snapshotSalePrice" DOUBLE PRECISION NOT NULL,
    "snapshotCostPrice" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "recipeName" TEXT,

    CONSTRAINT "SalesItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesRecord_userId_date_idx" ON "SalesRecord"("userId", "date");

-- CreateIndex
CREATE INDEX "SalesItem_salesRecordId_idx" ON "SalesItem"("salesRecordId");

-- CreateIndex
CREATE INDEX "SalesItem_recipeId_idx" ON "SalesItem"("recipeId");

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesItem" ADD CONSTRAINT "SalesItem_salesRecordId_fkey" FOREIGN KEY ("salesRecordId") REFERENCES "SalesRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
