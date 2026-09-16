const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../frontend/src');
const backendDir = path.resolve(__dirname, '../Backend');

// Recursive file scanner
function scanDir(dir, filterExts = [], ignoreDirs = ['node_modules', '.next', 'bin', 'obj', '.git']) {
  let list = [];
  if (!fs.existsSync(dir)) return list;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (ignoreDirs.includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      list = list.concat(scanDir(full, filterExts, ignoreDirs));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (filterExts.length === 0 || filterExts.includes(ext)) {
        list.push({
          full,
          rel: path.relative(path.dirname(dir), full).replace(/\\/g, '/'),
          name: item,
          base: path.basename(item, ext),
          ext,
          size: stat.size
        });
      }
    }
  }
  return list;
}

console.log('================================================================');
console.log('              FULL SYSTEM AUDIT REPORT                          ');
console.log('================================================================\n');

// 1. BACKEND AUDIT
const beFiles = scanDir(backendDir);
const beCsFiles = beFiles.filter(f => f.ext === '.cs');
const beSqlFiles = beFiles.filter(f => f.ext === '.sql');

console.log(`[BACKEND FILE COUNTS]`);
console.log(`  Total Files: ${beFiles.length}`);
console.log(`  C# (.cs): ${beCsFiles.length}`);
console.log(`  SQL Migrations (.sql): ${beSqlFiles.length}`);
console.log(`  Configurations (.json): ${beFiles.filter(f => f.ext === '.json').length}`);
console.log(`  Project Files (.csproj): ${beFiles.filter(f => f.ext === '.csproj').length}`);

// Backend duplicate filenames
const beFileNameMap = {};
for (const f of beCsFiles) {
  if (!beFileNameMap[f.name]) beFileNameMap[f.name] = [];
  beFileNameMap[f.name].push(f);
}
const beDups = Object.entries(beFileNameMap).filter(([k, v]) => v.length > 1);
console.log(`\n[BACKEND DUPLICATE FILENAMES]: ${beDups.length} found`);
beDups.forEach(([name, list]) => {
  console.log(`  - File: "${name}" (${list.length} instances):`);
  list.forEach(item => {
    const rel = path.relative(backendDir, item.full).replace(/\\/g, '/');
    console.log(`      * ${rel} (${item.size} bytes)`);
  });
});

// Check duplicate routes in backend controllers
const controllerRoutes = {};
const routeRegex = /\[Route\("([^"]+)"\)\]/g;
for (const f of beCsFiles) {
  if (f.name.endsWith('Controller.cs')) {
    const content = fs.readFileSync(f.full, 'utf8');
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const r = match[1];
      if (!controllerRoutes[r]) controllerRoutes[r] = [];
      controllerRoutes[r].push(f.name);
    }
  }
}
const dupRoutes = Object.entries(controllerRoutes).filter(([k, v]) => v.length > 1);
console.log(`\n[BACKEND CONTROLLER ROUTE OVERLAPS]: ${dupRoutes.length} found`);
dupRoutes.forEach(([route, controllers]) => {
  console.log(`  - Route "${route}" used by: ${controllers.join(', ')}`);
});

// 2. FRONTEND AUDIT
const feFiles = scanDir(frontendDir);
const feTsxFiles = feFiles.filter(f => f.ext === '.tsx');
const feTsFiles = feFiles.filter(f => f.ext === '.ts');
const feCssFiles = feFiles.filter(f => f.ext === '.css');

console.log(`\n----------------------------------------------------------------`);
console.log(`[FRONTEND FILE COUNTS]`);
console.log(`  Total Files: ${feFiles.length}`);
console.log(`  UI Components & Pages (.tsx): ${feTsxFiles.length}`);
console.log(`  Services, Hooks, Schemas, Types (.ts): ${feTsFiles.length}`);
console.log(`  Styles (.css): ${feCssFiles.length}`);

// Breakdown by major directories
const feDirs = {};
for (const f of feFiles) {
  const rel = path.relative(frontendDir, f.full).replace(/\\/g, '/');
  const topDir = rel.split('/')[0];
  if (!feDirs[topDir]) feDirs[topDir] = { total: 0, tsx: 0, ts: 0 };
  feDirs[topDir].total++;
  if (f.ext === '.tsx') feDirs[topDir].tsx++;
  if (f.ext === '.ts') feDirs[topDir].ts++;
}
console.log(`\n[FRONTEND DIRECTORY BREAKDOWN]`);
for (const [dir, data] of Object.entries(feDirs)) {
  console.log(`  /${dir.padEnd(16)}: ${data.total.toString().padStart(3)} files (UI .tsx: ${data.tsx.toString().padStart(3)}, Logic .ts: ${data.ts.toString().padStart(3)})`);
}

// Check Frontend duplicate filenames (excluding page.tsx, layout.tsx, types.ts, index.ts)
const ignoreNames = ['page.tsx', 'layout.tsx', 'types.ts', 'index.ts', 'loading.tsx', 'error.tsx', 'not-found.tsx'];
const feFileNameMap = {};
for (const f of feFiles) {
  if (ignoreNames.includes(f.name)) continue;
  if (!feFileNameMap[f.name]) feFileNameMap[f.name] = [];
  feFileNameMap[f.name].push(f);
}
const feDups = Object.entries(feFileNameMap).filter(([k, v]) => v.length > 1);
console.log(`\n[FRONTEND DUPLICATE FILENAMES]: ${feDups.length} found`);
feDups.forEach(([name, list]) => {
  console.log(`  - File: "${name}" (${list.length} instances):`);
  list.forEach(item => {
    const rel = path.relative(frontendDir, item.full).replace(/\\/g, '/');
    console.log(`      * ${rel} (${item.size} bytes)`);
  });
});

// UI Files Inventory
console.log(`\n----------------------------------------------------------------`);
console.log(`[UI FILES BREAKDOWN (511 .tsx files)]`);

// 1. Pages in app/
const appPages = feTsxFiles.filter(f => f.name === 'page.tsx');
console.log(`  - Total Next.js Route Pages (app/**/page.tsx): ${appPages.length}`);

// 2. Shared UI / Layout components (components/)
const compFiles = feTsxFiles.filter(f => path.relative(frontendDir, f.full).startsWith('components'));
console.log(`  - Shared UI & Layout Components (components/**): ${compFiles.length}`);

// 3. Feature Business Domain Components (features/)
const featureCompFiles = feTsxFiles.filter(f => path.relative(frontendDir, f.full).startsWith('features'));
console.log(`  - Feature Business Components (features/**): ${featureCompFiles.length}`);

// 4. Other UI (context, etc.)
const otherUi = feTsxFiles.filter(f => !path.relative(frontendDir, f.full).startsWith('components') && !path.relative(frontendDir, f.full).startsWith('features') && !path.relative(frontendDir, f.full).startsWith('app'));
console.log(`  - Context Providers & Providers (context/**): ${otherUi.length}`);
