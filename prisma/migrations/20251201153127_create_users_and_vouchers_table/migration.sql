/*
  Warnings:

  - You are about to drop the `voucher` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."voucher";

-- CreateTable
CREATE TABLE "vouchers" (
    "id" SERIAL NOT NULL,
    "voucher_code" TEXT,
    "user_group" TEXT,
    "status" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "price" DOUBLE PRECISION,
    "period" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "alias" TEXT,
    "phone_number" TEXT,
    "created_time" TIMESTAMP(3),
    "activated_time" TIMESTAMP(3),
    "expired_time" TIMESTAMP(3),
    "devices" TEXT,
    "mac_binding" BOOLEAN DEFAULT false,
    "trafic_used_total" TEXT,
    "upload_download_limit" TEXT,
    "is_printed" BOOLEAN DEFAULT false,
    "print_count" INTEGER DEFAULT 0,
    "print_last_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);
