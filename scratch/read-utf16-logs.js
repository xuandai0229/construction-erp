const fs = require('fs');
const path = require('path');

function searchLog(filename, query) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  
  console.log(`=== SEARCHING ${filename} FOR "${query}" ===`);
  const content = fs.readFileSync(filePath, 'utf16le');
  const lines = content.split(/\r?\n/);
  
  let matchCount = 0;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
      matchCount++;
    }
  });
  console.log(`Found ${matchCount} matches.\n`);
}

function printLogTail(filename, lineCount = 50) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  
  console.log(`=== TAIL OF ${filename} (last ${lineCount} lines) ===`);
  const content = fs.readFileSync(filePath, 'utf16le');
  const lines = content.split(/\r?\n/);
  const tail = lines.slice(-lineCount);
  tail.forEach((line, index) => {
    console.log(`${lines.length - lineCount + index + 1}: ${line}`);
  });
  console.log(`=== END OF TAIL ===\n`);
}

// Search for migrate/reset/seed commands
searchLog('dev_logs.txt', 'migrate');
searchLog('dev_logs.txt', 'reset');
searchLog('dev_logs.txt', 'seed');

searchLog('dev_logs_final.txt', 'migrate');
searchLog('dev_logs_final.txt', 'reset');
searchLog('dev_logs_final.txt', 'seed');

searchLog('dev_logs_new.txt', 'migrate');
searchLog('dev_logs_new.txt', 'reset');
searchLog('dev_logs_new.txt', 'seed');

// Let's print the tail of dev_logs.txt
printLogTail('dev_logs.txt', 40);
