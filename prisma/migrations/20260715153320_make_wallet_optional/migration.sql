-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "walletId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Income" ALTER COLUMN "walletId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RecurringTransaction" ALTER COLUMN "walletId" DROP NOT NULL;
