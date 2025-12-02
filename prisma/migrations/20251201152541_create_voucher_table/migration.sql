-- CreateTable
CREATE TABLE "voucher" (
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
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);
