const { spawn } = require('child_process');

console.log("=== STARTING FAKE TTY PRISMA MIGRATE ===");

// We spawn a child process but we set stdio to 'pipe' and mock TTY properties if possible,
// or we run it through node and override process.stdout.isTTY before loading the CLI.
const script = `
  process.stdout.isTTY = true;
  process.stderr.isTTY = true;
  process.stdin.isTTY = true;
  
  // Require and run the Prisma CLI
  require('prisma/build/index.js');
`;

const cp = spawn('node', ['-e', script, 'migrate', 'dev', '--create-only', '--name', 'reconcile_schema_drift'], {
  cwd: 'c:\\Users\\admin\\construction-erp',
  env: {
    ...process.env,
    PRISMA_CLI_IN_TTY: 'true'
  }
});

cp.stdout.on('data', (data) => {
  process.stdout.write(data.toString());
});

cp.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

cp.on('close', (code) => {
  console.log(`Prisma exit code: ${code}`);
});
