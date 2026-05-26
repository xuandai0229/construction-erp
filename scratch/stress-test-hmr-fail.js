const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting Next.js dev server with fake REDIS_URL...");
  const devProcess = spawn('npm', ['run', 'dev'], { 
    shell: true,
    env: { ...process.env, REDIS_URL: 'redis://localhost:9999' }
  });
  
  let logs = '';
  devProcess.stdout.on('data', data => {
    logs += data.toString();
  });
  devProcess.stderr.on('data', data => {
    logs += data.toString();
  });

  console.log("Waiting for server to start...");
  await sleep(10000); 

  const targetFile = path.join(__dirname, '../app/layout.tsx');
  let originalContent = fs.readFileSync(targetFile, 'utf8');

  console.log("Simulating 15 HMR saves...");
  for (let i = 0; i < 15; i++) {
    const modified = originalContent + `\n// HMR Trigger Fake Redis ${i}\n`;
    fs.writeFileSync(targetFile, modified);
    await sleep(2000);
  }

  fs.writeFileSync(targetFile, originalContent);
  await sleep(5000);

  const econnrefusedCount = (logs.match(/ECONNREFUSED/g) || []).length;
  const redisManagerWarnCount = (logs.match(/\[RedisManager\]/g) || []).length;
  const memoryFallbackWarnCount = (logs.match(/falling back to bounded memory cache/g) || []).length;
  const sweeperLogs = (logs.match(/Swept .* expired cache entries/g) || []).length;
  
  console.log(`ECONNREFUSED count: ${econnrefusedCount}`);
  console.log(`RedisManager logs count: ${redisManagerWarnCount}`);
  console.log(`Memory fallback logs count: ${memoryFallbackWarnCount}`);
  console.log(`Sweeper execution count: ${sweeperLogs}`);
  
  // Output a small sample of logs to see what's printing
  console.log("\nLast 1000 chars of logs:");
  console.log(logs.slice(-1000));

  console.log("Cleaning up...");
  devProcess.kill();
  process.exit(0);
}

run();
