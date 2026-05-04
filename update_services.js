const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/admin/construction-erp/app/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.service.ts') && f !== 'export.service.ts');

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(/console\.log\('\[SERVICE\] ([a-zA-Z0-9_]+)', [^;]+;\s*if\s*\(error\)\s*\{\s*return\s*\{\s*success:\s*false,\s*error:\s*error\.message\s*\};\s*\}/g, (match, funcName) => {
    return `if (error) {
    console.error('[SERVICE ERROR] ${funcName}:', error.message);
    return { success: false, error: error.message };
  }`;
  });

  fs.writeFileSync(p, content);
  console.log('Updated ' + f);
});
