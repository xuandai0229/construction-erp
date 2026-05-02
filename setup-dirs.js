const fs = require('fs');
const path = require('path');

// Directory structure to create
const dirs = [
  'app/(projects)',
  'app/project/[id]',
  'app/wbs',
  'app/costs',
  'app/debts',
  'app/reports',
];

// Create directories
dirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

// Create page files
const pageFiles = [
  ['app/(projects)/page.tsx', 'import ProjectsPageRoute from \'../projects-route\';\n\nexport default ProjectsPageRoute;'],
  ['app/project/[id]/page.tsx', 'import ProjectWBSPage from \'../../../project-wbs-page\';\n\nexport default ProjectWBSPage;'],
  ['app/wbs/page.tsx', 'import WBSPage from \'../wbs-page\';\n\nexport default WBSPage;'],
  ['app/costs/page.tsx', 'import CostsPage from \'../costs-page\';\n\nexport default CostsPage;'],
  ['app/debts/page.tsx', 'import DebtsPage from \'../debts-page\';\n\nexport default DebtsPage;'],
  ['app/reports/page.tsx', 'import ReportsPage from \'../reports-page\';\n\nexport default ReportsPage;'],
];

// Create files
pageFiles.forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log(`Created: ${filePath}`);
  }
});

console.log('Setup complete!');
