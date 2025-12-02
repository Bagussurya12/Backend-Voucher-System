-- AlterTable
ALTER TABLE "voucher" ADD COLUMN     "is_printed" BOOLEAN DEFAULT false,
ADD COLUMN     "print_count" INTEGER DEFAULT 0,
ADD COLUMN     "print_last_time" TIMESTAMP(3);
