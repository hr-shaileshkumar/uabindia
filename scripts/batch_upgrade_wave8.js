const fs = require('fs');
const path = require('path');

const targetPages = [
  { file: 'frontend/src/app/(protected)/administration/ai-assistant/page.tsx', key: 'administration.ai-assistant' },
  { file: 'frontend/src/app/(protected)/administration/audit-logs/page.tsx', key: 'administration.audit-logs' },
  { file: 'frontend/src/app/(protected)/administration/electronic-data-interchange/page.tsx', key: 'administration.electronic-data-interchange' },
  { file: 'frontend/src/app/(protected)/administration/entity-builder/page.tsx', key: 'administration.entity-builder' },
  { file: 'frontend/src/app/(protected)/administration/menu-builder/page.tsx', key: 'administration.menu-builder' },
  { file: 'frontend/src/app/(protected)/administration/module-mapping/page.tsx', key: 'administration.module-mapping' },
  { file: 'frontend/src/app/(protected)/administration/org-chart/page.tsx', key: 'administration.org-chart' },
  { file: 'frontend/src/app/(protected)/administration/privacy/page.tsx', key: 'administration.privacy' },
  { file: 'frontend/src/app/(protected)/administration/website/pages/page.tsx', key: 'administration.website.pages' },
  { file: 'frontend/src/app/(protected)/administration/website/settings/page.tsx', key: 'administration.website.settings' },
  { file: 'frontend/src/app/(protected)/administration/website/templates/page.tsx', key: 'administration.website.templates' },
  { file: 'frontend/src/app/(protected)/administration/website/themes/page.tsx', key: 'administration.website.themes' },
  { file: 'frontend/src/app/(protected)/administration/workflow-config/page.tsx', key: 'administration.workflow-config' },
  { file: 'frontend/src/app/(protected)/integrations/api-keys/page.tsx', key: 'integrations.api-keys' },
  { file: 'frontend/src/app/(protected)/integrations/apps/page.tsx', key: 'integrations.apps' },
  { file: 'frontend/src/app/(protected)/integrations/logs/page.tsx', key: 'integrations.logs' },
  { file: 'frontend/src/app/(protected)/manager-self-service/page.tsx', key: 'manager-self-service' },
  { file: 'frontend/src/app/(protected)/hrms/employees/new/page.tsx', key: 'hrms.employees.new' }
];

let upgradedCount = 0;

targetPages.forEach(({ file, key }) => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error('File not found: ' + file);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('DynamicPage')) {
    console.log('Already upgraded: ' + file);
    return;
  }

  // Find export default function Name
  const match = content.match(/export default (?:async )?function ([a-zA-Z0-9_]+)/);
  if (!match) {
    console.error('Could not find export default function in ' + file);
    return;
  }
  const func = match[1];

  // 1. Add DynamicPage import
  if (!content.includes('import { DynamicPage }')) {
    content = 'import { DynamicPage } from "@/components/dynamic/DynamicPage";\n' + content;
  }

  // 2. Rename export default function [func] to function Legacy[func]
  const targetExport = `export default function ${func}`;
  const targetAsyncExport = `export default async function ${func}`;
  const legacyFunc = `Legacy${func}`;

  if (content.includes(targetExport)) {
    content = content.replace(targetExport, `function ${legacyFunc}`);
  } else if (content.includes(targetAsyncExport)) {
    content = content.replace(targetAsyncExport, `async function ${legacyFunc}`);
  } else {
    console.error(`Export not matched for ${func} in ${file}`);
    return;
  }

  // 3. Append DynamicPage wrapper
  const wrapper = `\n\nexport default function ${func}() {\n  return (\n    <DynamicPage\n      pageKey="${key}"\n      fallback={<${legacyFunc} />}\n      renderMode="auto"\n    />\n  );\n}\n`;
  content = content.trimEnd() + wrapper;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Successfully upgraded: ${file} -> ${key}`);
  upgradedCount++;
});

console.log(`\nWave 8 Batch Complete: Upgraded ${upgradedCount} pages to DynamicPage!`);
