import { db } from "../src/lib/db";
import { processDueEmailDeliveries } from "../src/lib/email";
import {
  deleteBusinessData,
  deleteUserData,
  purgeExpiredOperationalData,
} from "../src/lib/operations";

async function main() {
  const [command, target, confirmation] = process.argv.slice(2);
  if (command === "health") {
    await db.$queryRaw`SELECT 1`;
    console.log("Database health check passed.");
  } else if (command === "list-businesses") {
    const businesses = await db.business.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        published: true,
        _count: { select: { quoteRequests: true } },
      },
    });
    console.table(
      businesses.map(({ _count, ...business }) => ({
        ...business,
        quotes: _count.quoteRequests,
      })),
    );
  } else if (command === "failed-emails") {
    const jobs = await db.emailDelivery.findMany({
      where: { status: { in: ["FAILED", "PROCESSING"] } },
      orderBy: { updatedAt: "asc" },
      select: {
        id: true,
        status: true,
        attemptCount: true,
        nextAttemptAt: true,
        updatedAt: true,
      },
    });
    console.table(jobs);
  } else if (command === "retry-emails") {
    console.log(
      `Processed ${await processDueEmailDeliveries()} due email job(s).`,
    );
  } else if (command === "cleanup") {
    console.log(await purgeExpiredOperationalData());
  } else if (command === "unpublish" && target) {
    await db.business.update({
      where: { id: target },
      data: { published: false },
    });
    console.log("Business unpublished.");
  } else if (
    command === "delete-business" &&
    target &&
    confirmation === `--confirm=${target}`
  ) {
    console.log(await deleteBusinessData(target));
  } else if (
    command === "delete-user" &&
    target &&
    confirmation === `--confirm=${target}`
  ) {
    const user = await db.user.findUnique({
      where: { email: target },
      select: { id: true },
    });
    if (!user) throw new Error("User not found");
    console.log(await deleteUserData(user.id));
  } else {
    throw new Error(
      "Usage: ops <health|list-businesses|failed-emails|retry-emails|cleanup|unpublish ID|delete-business ID --confirm=ID|delete-user EMAIL --confirm=EMAIL>",
    );
  }
}

main().finally(() => db.$disconnect());
