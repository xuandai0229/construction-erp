const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'artifacts',
  'playwright-report',
  'test-results',
];

const ENTRY_POINTS = [];
const ALL_FILES = [];
const DEPENDENCIES = new Set();
const DEPENDENCY_USAGE = {};

// Load package.json dependencies
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const allDeclaredDeps = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
];
allDeclaredDeps.forEach(dep => {
  DEPENDENCY_USAGE[dep] = [];
});

// Recursively get files
function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      getFiles(res);
    } else {
      const relPath = path.relative(ROOT_DIR, res);
      ALL_FILES.push(relPath);
      
      // Determine if entry point
      if (
        relPath.startsWith('app' + path.sep) && 
        (entry.name === 'page.tsx' || entry.name === 'layout.tsx' || entry.name === 'route.ts' || entry.name === 'middleware.ts' || entry.name === 'globals.css')
      ) {
        ENTRY_POINTS.push(relPath);
      } else if (
        entry.name === 'next.config.ts' ||
        entry.name === 'postcss.config.js' ||
        entry.name === 'tsconfig.json' ||
        entry.name === 'eslint.config.mjs' ||
        entry.name === 'playwright.config.ts'
      ) {
        ENTRY_POINTS.push(relPath);
      } else if (relPath.startsWith('tests' + path.sep) && (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.ts'))) {
        ENTRY_POINTS.push(relPath);
      }
    }
  }
}

getFiles(ROOT_DIR);

// Also add npm scripts as entries if they point to scripts
Object.values(packageJson.scripts || {}).forEach(script => {
  const matchTs = script.match(/scripts\/[a-zA-Z0-9_\-.]+\.ts/);
  const matchJs = script.match(/scripts\/[a-zA-Z0-9_\-.]+\.js/);
  if (matchTs) ENTRY_POINTS.push(matchTs[0].replace(/\//g, path.sep));
  if (matchJs) ENTRY_POINTS.push(matchJs[0].replace(/\//g, path.sep));
});

console.log(`Found ${ALL_FILES.length} files in total.`);
console.log(`Found ${ENTRY_POINTS.length} entry points.`);

const importGraph = {};
const importedByGraph = {};

ALL_FILES.forEach(file => {
  importGraph[file] = [];
  importedByGraph[file] = [];
});

const IMPORT_REGEXES = [
  /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
  /import\s+['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /export\s+.*\s+from\s+['"]([^'"]+)['"]/g
];

function resolveImport(importingFile, importPath) {
  if (!importPath) return null;
  
  // Check if npm module
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    // It's a package
    let basePkg = importPath.split('/')[0];
    if (importPath.startsWith('@')) {
      basePkg = importPath.split('/').slice(0, 2).join('/');
    }
    if (DEPENDENCY_USAGE[basePkg]) {
      if (!DEPENDENCY_USAGE[basePkg].includes(importingFile)) {
        DEPENDENCY_USAGE[basePkg].push(importingFile);
      }
    }
    return null;
  }
  
  let resolvedPath = '';
  if (importPath.startsWith('@/')) {
    resolvedPath = path.join(ROOT_DIR, importPath.slice(2));
  } else {
    resolvedPath = path.resolve(path.dirname(path.join(ROOT_DIR, importingFile)), importPath);
  }
  
  const relResolved = path.relative(ROOT_DIR, resolvedPath);
  
  // Check extensions
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts', '.css', '.png', '.svg', '.jpg'];
  for (const ext of exts) {
    const testPath = relResolved + ext;
    if (ALL_FILES.includes(testPath)) {
      return testPath;
    }
  }
  
  // Check folder index
  for (const ext of exts) {
    const testPath = path.join(relResolved, 'index' + ext);
    if (ALL_FILES.includes(testPath)) {
      return testPath;
    }
  }
  
  if (ALL_FILES.includes(relResolved)) {
    return relResolved;
  }
  
  return null;
}

// Build Graph
ALL_FILES.forEach(file => {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx') && !file.endsWith('.py') && !file.endsWith('.mjs')) {
    return;
  }
  
  const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
  IMPORT_REGEXES.forEach(regex => {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = resolveImport(file, importPath);
      if (resolved && resolved !== file) {
        if (!importGraph[file].includes(resolved)) {
          importGraph[file].push(resolved);
        }
        if (!importedByGraph[resolved].includes(file)) {
          importedByGraph[resolved].push(file);
        }
      }
    }
  });
});

// Reachability analysis
const reachable = new Set();
const queue = [...ENTRY_POINTS];
queue.forEach(ep => reachable.add(ep));

while (queue.length > 0) {
  const current = queue.shift();
  const imports = importGraph[current] || [];
  for (const imp of imports) {
    if (!reachable.has(imp)) {
      reachable.add(imp);
      queue.push(imp);
    }
  }
}

// Separate files into groups
const unreachableFiles = [];
const reachableFiles = [];
const garbageFiles = [];
const tempFiles = [];
const docFiles = [];
const scriptFiles = [];

ALL_FILES.forEach(file => {
  const lowerFile = file.toLowerCase();
  
  // Categorize some clear garbage/logs/backups
  if (
    lowerFile.endsWith('.bak') ||
    lowerFile.endsWith('.old') ||
    lowerFile.endsWith('.tmp') ||
    lowerFile.includes('untitled') ||
    lowerFile.includes('copy') ||
    lowerFile.endsWith('.log') ||
    lowerFile.includes('dev_logs') ||
    (lowerFile.endsWith('.txt') && !lowerFile.includes('readme') && !lowerFile.includes('todo') && !lowerFile.includes('claude') && !lowerFile.includes('agents')) ||
    lowerFile === 'validation-report.json'
  ) {
    garbageFiles.push({ file, size: fs.statSync(path.join(ROOT_DIR, file)).size, reason: 'Temporary log, backup or debug file' });
    return;
  }
  
  if (file.startsWith('scratch' + path.sep)) {
    tempFiles.push({ file, size: fs.statSync(path.join(ROOT_DIR, file)).size, reason: 'Scratch workspace debugging file' });
    return;
  }
  
  if (
    file.endsWith('.md') && 
    file !== 'README.md' && 
    file !== 'AGENTS.md' &&
    file !== 'CLAUDE.md'
  ) {
    docFiles.push({ file, size: fs.statSync(path.join(ROOT_DIR, file)).size, reason: 'Audit or development documentation artifact' });
    return;
  }
  
  if (file.startsWith('scripts' + path.sep)) {
    scriptFiles.push(file);
  }
  
  if (reachable.has(file)) {
    reachableFiles.push(file);
  } else {
    unreachableFiles.push(file);
  }
});

const report = {
  totalFiles: ALL_FILES.length,
  entryPointsCount: ENTRY_POINTS.length,
  reachableCount: reachableFiles.length,
  unreachableCount: unreachableFiles.length,
  garbageCount: garbageFiles.length,
  tempCount: tempFiles.length,
  docCount: docFiles.length,
  
  unreachable: unreachableFiles.map(f => ({
    file: f,
    size: fs.statSync(path.join(ROOT_DIR, f)).size
  })),
  garbage: garbageFiles,
  scratch: tempFiles,
  docs: docFiles,
  dependencyUsage: DEPENDENCY_USAGE
};

fs.writeFileSync(path.join(ROOT_DIR, 'scratch', 'audit_result.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Audit completed successfully. Results written to scratch/audit_result.json.');
