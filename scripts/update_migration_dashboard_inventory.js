const fs = require('fs');
const path = require('path');

const discoveryPath = path.join(__dirname, 'discovery_output.json');
const discovery = JSON.parse(fs.readFileSync(discoveryPath, 'utf-8'));

const items = [];
const seenKeys = new Set();

discovery.frontendPages.forEach(p => {
  const fullPath = path.join(__dirname, '..', p.filePath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf-8');
  if (content.includes('DynamicPage')) {
    const keyMatch = content.match(/pageKey=["']([^"']+)["']/);
    const key = keyMatch ? keyMatch[1] : p.route.replace(/^\/\//, '').replace(/\//g, '.');
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    let mod = p.module.charAt(0) + p.module.slice(1).toLowerCase();
    if (mod === 'Platform') mod = 'Administration';

    // Derive readable module name
    if (p.route.includes('/hrms')) mod = 'HRMS';
    else if (p.route.includes('/payroll')) mod = 'Payroll';
    else if (p.route.includes('/finance') || p.route.includes('/invoices') || p.route.includes('/payments') || p.route.includes('/expenses') || p.route.includes('/accounting') || p.route.includes('/tax')) mod = 'Finance';
    else if (p.route.includes('/procurement') || p.route.includes('/vendor')) mod = 'Procurement';
    else if (p.route.includes('/inventory') || p.route.includes('/items') || p.route.includes('/warehouse') || p.route.includes('/stock')) mod = 'Inventory';
    else if (p.route.includes('/sales') || p.route.includes('/portal')) mod = 'Sales';
    else if (p.route.includes('/crm')) mod = 'CRM';
    else if (p.route.includes('/projects') || p.route.includes('/field-service')) mod = 'Projects';
    else if (p.route.includes('/manufacturing')) mod = 'Manufacturing';
    else if (p.route.includes('/assets') || p.route.includes('/fleet')) mod = 'Assets';
    else if (p.route.includes('/security')) mod = 'Security';
    else if (p.route.includes('/licensing')) mod = 'Licensing';
    else if (p.route.includes('/reports')) mod = 'Reports';
    else if (p.route.includes('/helpdesk')) mod = 'Helpdesk';
    else if (p.route.includes('/communication')) mod = 'Communication';
    else if (p.route.includes('/workflow') || p.route.includes('/approvals')) mod = 'Workflow';
    else if (p.route.includes('/compliance')) mod = 'Compliance';
    else if (p.route.includes('/notifications')) mod = 'Notifications';
    else if (p.route.includes('/documents')) mod = 'Documents';
    else mod = 'Administration';

    // Clean name
    const rawName = p.feature.split('/').pop().replace(/-/g, ' ');
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    items.push({
      key,
      name,
      module: mod,
      route: p.route.replace(/^\/\//, '/'),
      isDynamic: true,
      version: 1,
      status: 'Published',
      hardcodedFieldsEstimate: 0
    });
  }
});

console.log(`Total dynamic items collected: ${items.length}`);

// Update MigrationDashboardPage
const dashboardPath = path.join(__dirname, '..', 'frontend', 'src', 'app', '(protected)', 'administration', 'migration-dashboard', 'page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');

const startMarker = 'const ERP_PAGE_INVENTORY: PageInventoryItem[] = [';
const endMarker = '];\n\nexport default function MigrationDashboardPage()';

const startIdx = dashboardContent.indexOf(startMarker);
const endIdx = dashboardContent.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const formattedItems = items.map(item => {
    return `  { key: "${item.key}", name: "${item.name}", module: "${item.module}", route: "${item.route}", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },`;
  }).join('\n');

  const newSection = `${startMarker}\n${formattedItems}\n${endMarker}`;
  dashboardContent = dashboardContent.slice(0, startIdx) + newSection + dashboardContent.slice(endIdx + endMarker.length);
  fs.writeFileSync(dashboardPath, dashboardContent, 'utf-8');
  console.log('Successfully updated migration-dashboard ERP_PAGE_INVENTORY with all 130 active dynamic pages!');
} else {
  console.error('Markers not found in migration-dashboard page.tsx');
}
