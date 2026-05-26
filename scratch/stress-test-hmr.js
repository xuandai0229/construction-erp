const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting Next.js dev server...");
  const devProcess = spawn('npm', ['run', 'dev'], { shell: true });
  
  let logs = '';
  devProcess.stdout.on('data', data => {
    const str = data.toString();
    logs += str;
  });
  devProcess.stderr.on('data', data => {
    const str = data.toString();
    logs += str;
  });

  console.log("Waiting for server to start...");
  await sleep(10000); // 10 seconds to compile and start

  const targetFile = path.join(__dirname, '../app/layout.tsx');
  let originalContent = fs.readFileSync(targetFile, 'utf8');

  console.log("Simulating 15 HMR saves...");
  for (let i = 0; i < 15; i++) {
    const modified = originalContent + `\n// HMR Trigger ${i}\n`;
    fs.writeFileSync(targetFile, modified);
    await sleep(2000); // Wait for HMR to process
  }

  // Restore original
  fs.writeFileSync(targetFile, originalContent);
  await sleep(5000);

  // Count ECONNREFUSED in logs
  const econnrefusedCount = (logs.match(/ECONNREFUSED/g) || []).length;
  console.log(`ECONNREFUSED count: ${econnrefusedCount}`);
  
  const redisManagerWarnCount = (logs.match(/\[RedisManager\]/g) || []).length;
  console.log(`RedisManager logs count: ${redisManagerWarnCount}`);

  console.log("Cleaning up...");
  devProcess.kill();
  process.exit(0);
}

run();
