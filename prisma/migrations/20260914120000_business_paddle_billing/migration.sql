-- Billing is optional so existing businesses migrate without data changes.
CREATE TABLE "BusinessBilling" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "paddleCustomerId" TEXT NOT NULL,
    "paddleSubscriptionId" TEXT NOT NULL,
    "paddlePriceId" TEXT,
    "status" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "nextBilledAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "lastPaddleEventId" TEXT NOT NULL,
    "lastPaddleEventOccurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessBilling_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessBilling_businessId_key" ON "BusinessBilling"("businessId");
CREATE UNIQUE INDEX "BusinessBilling_paddleSubscriptionId_key" ON "BusinessBilling"("paddleSubscriptionId");
CREATE UNIQUE INDEX "BusinessBilling_lastPaddleEventId_key" ON "BusinessBilling"("lastPaddleEventId");
CREATE INDEX "BusinessBilling_paddleCustomerId_idx" ON "BusinessBilling"("paddleCustomerId");
CREATE INDEX "BusinessBilling_status_idx" ON "BusinessBilling"("status");

ALTER TABLE "BusinessBilling"
ADD CONSTRAINT "BusinessBilling_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
