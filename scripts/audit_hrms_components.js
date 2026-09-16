const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      results = results.concat(walk(p));
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      results.push(p);
    }
  }
  return results;
}

const allFiles = walk('frontend/src');
const hrmsComponents = fs.readdirSync('frontend/src/features/hrms/components').filter(f => f.endsWith('.tsx'));

console.log('=== AUDIT OF features/hrms/components ===');
for (const comp of hrmsComponents) {
  const baseName = comp.replace('.tsx', '');
  const consumers = [];
  for (const f of allFiles) {
    if (f.includes('features\\hrms\\components\\' + comp) || f.includes('features/hrms/components/' + comp)) continue;
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes(`/${baseName}`) || content.includes(`"${baseName}"`) || content.includes(`'${baseName}'`) || content.includes(baseName)) {
      consumers.push(f.replace('frontend\\src\\', '').replace('frontend/src/', ''));
    }
  }
  const fullPath = path.join('frontend/src/features/hrms/components', comp);
  const size = fs.statSync(fullPath).size;
  console.log(`\nFile: ${comp} (${size} bytes) - referenced in ${consumers.length} files:`);
  consumers.forEach(c => console.log(`   -> ${c}`));
}
