import { StartupValidator } from "../lib/startup-validator";

async function run() {
  console.log("=== RUNNING STARTUP VALIDATOR INTEGRITY CHECK ===");
  const result = await StartupValidator.validate();
  console.log("HEALTH RESULT:", JSON.stringify(result, null, 2));
}

run();
