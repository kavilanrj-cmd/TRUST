-- AlterEnum: extend PaymentStatus with the manual UPI verification lifecycle
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING_VERIFICATION';
ALTER TYPE "PaymentStatus" ADD VALUE 'VERIFIED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REJECTED';

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL_UPI', 'RAZORPAY');

-- AlterTable: manual UPI verification metadata (backward compatible)
ALTER TABLE "Payment"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'MANUAL_UPI',
ADD COLUMN "verifiedById" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationNote" TEXT;