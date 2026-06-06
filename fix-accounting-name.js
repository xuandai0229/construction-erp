const fs = require('fs');
let content = fs.readFileSync('app/accounting/page.tsx', 'utf8');
content = content.replace('{project.name}', '{formatProjectName(project.name)}');
content = content.replace("{selectedProject?.name || 'Chưa chọn'}", "{formatProjectName(selectedProject?.name) || 'Chưa chọn'}");
fs.writeFileSync('app/accounting/page.tsx', content, 'utf8');
console.log('Fixed project name in accounting');
