const fs = require('fs');
const path = 'app/budget/page.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('}) )}`', '}) )}');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed backtick.');
