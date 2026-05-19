const fs = require('fs');
const path = require('path');

const logPath = path.resolve('c:\\Users\\admin\\construction-erp', '.next/dev/logs/next-development.log');
if (!fs.existsSync(logPath)) {
  console.log("Log file does not exist.");
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.trim().split('\n');
console.log(`LAST 15 LOG LINES (Total: ${lines.length}):`);
lines.slice(-15).forEach(line => {
  try {
    const parsed = JSON.parse(line);
    console.log(`[${parsed.timestamp}] [${parsed.source}] [${parsed.level}] ${parsed.message}`);
  } catch (e) {
    console.log(line);
  }
});
