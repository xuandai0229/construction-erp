const fs = require('fs');
const path = require('path');

const logPath = path.resolve('c:\\Users\\admin\\construction-erp', '.next/dev/logs/next-development.log');
if (!fs.existsSync(logPath)) {
  console.log("Log file does not exist at:", logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log("TOTAL LOG LINES:", lines.length);

const nonRedisErrors = [];
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const parsed = JSON.parse(line);
    const msgStr = parsed.message || '';
    if (msgStr.includes('Redis connection error')) {
      continue;
    }
    nonRedisErrors.push(parsed);
  } catch (e) {
    if (!line.includes('Redis connection error')) {
      nonRedisErrors.push({ raw: line });
    }
  }
}

console.log("NON-REDIS LOGS (Last 20):");
nonRedisErrors.slice(-20).forEach(log => {
  console.log(JSON.stringify(log, null, 2));
});
