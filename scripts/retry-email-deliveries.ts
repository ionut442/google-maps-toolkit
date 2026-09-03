import { db } from "../src/lib/db";
import { processDueEmailDeliveries } from "../src/lib/email";

async function main() {
  const processed = await processDueEmailDeliveries();
  process.stdout.write(`Processed ${processed} due email delivery job(s).\n`);
}

main()
  .catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Email retry failed"}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
