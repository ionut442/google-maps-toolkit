ALTER TABLE "BusinessModule" ADD COLUMN "customizedAt" TIMESTAMP(3);

DROP INDEX "TrustEvidence_businessId_entryId_key";
CREATE INDEX "TrustEvidence_businessId_entryId_idx" ON "TrustEvidence"("businessId", "entryId");
