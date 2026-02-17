-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "unitId" UUID NOT NULL,
    "currency" "Currency" NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'package',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleExpenseItem" (
    "id" UUID NOT NULL,
    "salesRecordId" UUID NOT NULL,
    "expenseItemId" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "snapshotPrice" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,

    CONSTRAINT "SaleExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseItem_userId_idx" ON "ExpenseItem"("userId");

-- CreateIndex
CREATE INDEX "SaleExpenseItem_salesRecordId_idx" ON "SaleExpenseItem"("salesRecordId");

-- CreateIndex
CREATE INDEX "SaleExpenseItem_expenseItemId_idx" ON "SaleExpenseItem"("expenseItemId");

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleExpenseItem" ADD CONSTRAINT "SaleExpenseItem_salesRecordId_fkey" FOREIGN KEY ("salesRecordId") REFERENCES "SalesRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleExpenseItem" ADD CONSTRAINT "SaleExpenseItem_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
