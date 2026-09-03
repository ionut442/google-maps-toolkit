-- CreateTable
CREATE TABLE "TrustEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "TrustEvidence_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustEvidence_objectKey_key" ON "TrustEvidence"("objectKey");

-- CreateIndex
CREATE INDEX "TrustEvidence_businessId_idx" ON "TrustEvidence"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustEvidence_businessId_entryId_key" ON "TrustEvidence"("businessId", "entryId");
