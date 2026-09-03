-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionKey" TEXT NOT NULL,
    "configSnapshot" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "QuoteRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteRequestId" TEXT NOT NULL,
    CONSTRAINT "QuoteUpload_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destination" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    CONSTRAINT "EmailDelivery_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteRateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "QuoteRateLimit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_businessId_submissionKey_key" ON "QuoteRequest"("businessId", "submissionKey");
CREATE INDEX "QuoteRequest_businessId_createdAt_idx" ON "QuoteRequest"("businessId", "createdAt");
CREATE UNIQUE INDEX "QuoteUpload_objectKey_key" ON "QuoteUpload"("objectKey");
CREATE INDEX "QuoteUpload_quoteRequestId_idx" ON "QuoteUpload"("quoteRequestId");
CREATE UNIQUE INDEX "EmailDelivery_quoteRequestId_key" ON "EmailDelivery"("quoteRequestId");
CREATE INDEX "EmailDelivery_status_nextAttemptAt_idx" ON "EmailDelivery"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "QuoteRateLimit_businessId_clientHash_key" ON "QuoteRateLimit"("businessId", "clientHash");
CREATE INDEX "QuoteRateLimit_windowStart_idx" ON "QuoteRateLimit"("windowStart");
