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

const all = walk('frontend/src/app');
const bad = [];

for (const file of all) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('"use client"') || content.includes("'use client'")) {
    const lines = content.split('\n');
    let useClientIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
        useClientIdx = i;
        break;
      }
    }
    
    // Check if any imports or code come before useClientIdx
    if (useClientIdx > 0) {
      const beforeLines = lines.slice(0, useClientIdx).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('/*'));
      if (beforeLines.length > 0) {
        bad.push({ file, useClientIdx, before: beforeLines[0] });
      }
    }
  }
}

console.log(`Found ${bad.length} files with misplaced 'use client':`);
for (const b of bad) {
  console.log(`- ${b.file} (line ${b.useClientIdx + 1}): before was "${b.before}"`);
}

// Fix them
let fixedCount = 0;
for (const b of bad) {
  let content = fs.readFileSync(b.file, 'utf8');
  // Remove existing "use client"; or 'use client';
  content = content.replace(/["']use client["'];?\r?\n?/g, '');
  // Prepend "use client"; at the very top
  content = '"use client";\n\n' + content.trimStart();
  fs.writeFileSync(b.file, content, 'utf8');
  fixedCount++;
}

console.log(`Successfully fixed ${fixedCount} files!`);
