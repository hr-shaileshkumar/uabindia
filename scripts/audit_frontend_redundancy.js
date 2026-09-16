const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../frontend/src');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.css']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const allFiles = getAllFiles(srcDir);
console.log('=== TOTAL FILES IN FRONTEND/SRC: ' + allFiles.length + ' ===');

const fileContents = allFiles.map(f => ({
  path: f,
  rel: path.relative(srcDir, f).replace(/\\/g, '/'),
  base: path.basename(f),
  nameWithoutExt: path.basename(f, path.extname(f)),
  size: fs.statSync(f).size,
  content: fs.readFileSync(f, 'utf8')
}));

// Known entry points in Next.js App Router
const entryPoints = [
  'page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx',
  'not-found.tsx', 'global-error.tsx', 'route.ts', 'middleware.ts',
  'globals.css', 'index.ts'
];

const nonEntryFiles = fileContents.filter(f => !entryPoints.includes(f.base));

// Check unreferenced files
const unreferenced = [];

for (const target of nonEntryFiles) {
  const targetName = target.nameWithoutExt;
  let isImported = false;

  for (const file of fileContents) {
    if (file.path === target.path) continue;
    if (file.content.includes(targetName)) {
      isImported = true;
      break;
    }
  }

  if (!isImported) {
    unreferenced.push(target);
  }
}

console.log('\n=== POTENTIALLY UNREFERENCED / ORPHANED FILES (' + unreferenced.length + ') ===');
unreferenced.forEach(u => {
  console.log(`[ORPHAN] ${u.rel} (${u.size} bytes)`);
});

// Check for duplicate names across different directories
const namesMap = {};
for (const f of fileContents) {
  if (entryPoints.includes(f.base)) continue;
  if (!namesMap[f.base]) {
    namesMap[f.base] = [];
  }
  namesMap[f.base].push(f);
}

const duplicateNames = Object.entries(namesMap).filter(([name, files]) => files.length > 1);
console.log('\n=== FILES WITH IDENTICAL NAMES IN MULTIPLE FOLDERS (' + duplicateNames.length + ') ===');
duplicateNames.forEach(([name, files]) => {
  console.log(`\nDuplicate: "${name}" (${files.length} occurrences):`);
  files.forEach(f => {
    console.log(`  - ${f.rel} (${f.size} bytes)`);
  });
});

// Check empty directories in frontend
function getEmptyDirs(dir) {
  let empty = [];
  const list = fs.readdirSync(dir);
  if (list.length === 0) {
    empty.push(dir);
  } else {
    for (const item of list) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        const subEmpty = getEmptyDirs(full);
        if (subEmpty.length > 0 && fs.readdirSync(full).length === subEmpty.length) {
          empty.push(full);
        } else {
          empty = empty.concat(subEmpty);
        }
      }
    }
  }
  return empty;
}

const emptyDirs = getEmptyDirs(srcDir);
console.log('\n=== EMPTY DIRECTORIES (' + emptyDirs.length + ') ===');
emptyDirs.forEach(d => {
  console.log(' - ' + path.relative(srcDir, d).replace(/\\/g, '/'));
});

// Check routes in src/app/(protected) to see if there are legacy or unnavigable routes
const appDir = path.join(srcDir, 'app/(protected)');
const allRoutes = [];
function findRoutes(dir, routePrefix = '') {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      findRoutes(full, routePrefix ? `${routePrefix}/${item}` : item);
    } else if (item === 'page.tsx') {
      allRoutes.push(routePrefix);
    }
  }
}
findRoutes(appDir);
console.log('\n=== TOTAL PROTECTED ROUTES FOUND IN APP/(PROTECTED): ' + allRoutes.length + ' ===');

// Check which routes are in route-config.ts or navigation.ts
const routeConfigFile = path.join(srcDir, 'lib/workspace/route-config.ts');
const navFile = path.join(srcDir, 'lib/workspace/navigation.ts');
const routeConfigContent = fs.existsSync(routeConfigFile) ? fs.readFileSync(routeConfigFile, 'utf8') : '';
const navContent = fs.existsSync(navFile) ? fs.readFileSync(navFile, 'utf8') : '';

const missingFromConfig = [];
allRoutes.forEach(r => {
  const cleanRoute = '/' + r;
  if (!routeConfigContent.includes(cleanRoute) && !navContent.includes(cleanRoute)) {
    missingFromConfig.push(cleanRoute);
  }
});
console.log('\n=== ROUTES NOT FOUND IN NAVIGATION OR ROUTE-CONFIG (' + missingFromConfig.length + ') ===');
missingFromConfig.forEach(r => console.log(' [UNLINKED ROUTE] ' + r));
