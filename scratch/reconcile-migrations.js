const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '..', 'prisma', 'migrations');
const newMigrationName = '20260519000000_reconcile_schema_drift';
const newMigrationFolder = path.join(migrationsDir, newMigrationName);
const newMigrationFile = path.join(newMigrationFolder, 'migration.sql');

async function run() {
  console.log("=== STARTING MIGRATION GOVERNANCE REBUILD ===");

  try {
    // 0. Clean up folder if it was created in failed attempt
    if (fs.existsSync(newMigrationFolder)) {
      console.log(`Cleaning up existing directory first: ${newMigrationFolder}`);
      fs.rmSync(newMigrationFolder, { recursive: true, force: true });
    }

    // 1. Run prisma migrate diff and save the output
    console.log("Generating migration SQL script via prisma migrate diff...");
    const cmd = `npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --shadow-database-url "postgresql://postgres:123456@localhost:5432/construction_erp_shadow" --script`;
    const sqlOutput = execSync(cmd, { cwd: path.resolve(__dirname, '..') });
    
    // 2. Now create the folder and write the migration file
    fs.mkdirSync(newMigrationFolder, { recursive: true });
    console.log(`Created migration directory: ${newMigrationFolder}`);
    
    fs.writeFileSync(newMigrationFile, sqlOutput);
    console.log(`Saved migration SQL to: ${newMigrationFile}`);

    // 3. Reconcile migration history in active database by resolving the migration as applied
    console.log("Recording migration as applied in _prisma_migrations table...");
    const resolveCmd = `npx prisma migrate resolve --applied ${newMigrationName}`;
    const resolveOutput = execSync(resolveCmd, { cwd: path.resolve(__dirname, '..') });
    console.log(resolveOutput.toString());

    console.log("=== MIGRATION GOVERNANCE REBUILD COMPLETED WITH 100% SUCCESS ===");
  } catch (err) {
    console.error("Migration reconciliation failed:", err);
  }
}

run();
