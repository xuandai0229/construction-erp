const { spawn } = require('child_process');

console.log("=== SPAWNING WITH STDIO INHERIT & SHELL ===");
const cp = spawn('npx', ['prisma', 'migrate', 'dev', '--create-only', '--name', 'reconcile_schema_drift'], {
  cwd: 'c:\\Users\\admin\\construction-erp',
  stdio: 'inherit',
  shell: true
});

cp.on('close', (code) => {
  console.log(`Prisma exit code: ${code}`);
});
