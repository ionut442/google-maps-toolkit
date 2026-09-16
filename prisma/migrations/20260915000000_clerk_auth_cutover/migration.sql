-- Link existing LocalAction users to Clerk without changing local ownership IDs.
ALTER TABLE "User"
ADD COLUMN "clerkUserId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
