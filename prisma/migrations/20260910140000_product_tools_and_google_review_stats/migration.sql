ALTER TABLE "Business"
ADD COLUMN "googleReviewScore" DOUBLE PRECISION,
ADD COLUMN "googleReviewCount" INTEGER,
ADD COLUMN "googleReviewStatsUpdatedAt" TIMESTAMP(3),
ADD COLUMN "displayGoogleReviewScore" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "displayGoogleReviewCount" BOOLEAN NOT NULL DEFAULT false;

WITH module_defaults("type", "offset", "config") AS (
  VALUES
    ('SERVICES', 1, '{"label":"Services","categories":[]}'),
    ('WORK_HOURS', 2, '{"label":"Work days & hours","days":[{"day":"MONDAY","status":"CLOSED"},{"day":"TUESDAY","status":"CLOSED"},{"day":"WEDNESDAY","status":"CLOSED"},{"day":"THURSDAY","status":"CLOSED"},{"day":"FRIDAY","status":"CLOSED"},{"day":"SATURDAY","status":"CLOSED"},{"day":"SUNDAY","status":"CLOSED"}]}'),
    ('PROMOTIONS', 3, '{"label":"Special Offers","offers":[]}')
), business_orders AS (
  SELECT
    b."id" AS "businessId",
    COALESCE(MAX(m."sortOrder"), -1) AS "lastSortOrder"
  FROM "Business" b
  LEFT JOIN "BusinessModule" m ON m."businessId" = b."id"
  GROUP BY b."id"
)
INSERT INTO "BusinessModule" (
  "id",
  "type",
  "enabled",
  "sortOrder",
  "config",
  "customizedAt",
  "createdAt",
  "updatedAt",
  "businessId"
)
SELECT
  md5(bo."businessId" || ':' || defaults."type"),
  defaults."type",
  false,
  bo."lastSortOrder" + defaults."offset",
  defaults."config",
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  bo."businessId"
FROM business_orders bo
CROSS JOIN module_defaults defaults
ON CONFLICT ("businessId", "type") DO NOTHING;
