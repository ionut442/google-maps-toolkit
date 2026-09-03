import "dotenv/config";
import { productionEnvironmentIssues } from "../src/lib/environment";

const issues = productionEnvironmentIssues(process.env);
if (issues.length) {
  console.error("Production configuration is invalid:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Production configuration is valid.");
}
