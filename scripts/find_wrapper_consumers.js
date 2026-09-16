const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
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

const wrappers = [
  { name: 'CrmLeadsManager', oldPath: '@/features/crm/components/CrmLeadsManager', canonical: '@/features/crm/leads' },
  { name: 'BankReconciliationManager', oldPath: '@/features/finance/components/BankReconciliationManager', canonical: '@/features/finance/bank-reconciliation' },
  { name: 'AttendanceList', oldPath: '@/features/hrms/components/AttendanceList', canonical: '@/features/hrms/attendance' },
  { name: 'LeaveManager', oldPath: '@/features/hrms/components/LeaveManager', canonical: '@/features/hrms/leave' },
  { name: 'ProbationManager', oldPath: '@/features/hrms/components/ProbationManager', canonical: '@/features/hrms/probation/components/ProbationManager' },
  { name: 'RecruitmentManager', oldPath: '@/features/hrms/components/RecruitmentManager', canonical: '@/features/hrms/recruitment/components/RecruitmentManager' },
  { name: 'TravelManager', oldPath: '@/features/hrms/components/TravelManager', canonical: '@/features/hrms/travel/components/TravelManager' },
  { name: 'WarehouseManager', oldPath: '@/features/inventory/components/WarehouseManager', canonical: '@/features/inventory/warehouses' },
  { name: 'LoansManager', oldPath: '@/features/payroll/components/LoansManager', canonical: '@/features/payroll/loans/components/LoansManager' },
  { name: 'StructuresManager', oldPath: '@/features/payroll/components/StructuresManager', canonical: '@/features/payroll/structures/components/StructuresManager' },
  { name: 'TaxDeclarationsManager', oldPath: '@/features/payroll/components/TaxDeclarationsManager', canonical: '@/features/payroll/tax-declarations/components/TaxDeclarationsManager' },
  { name: 'QuotationManager', oldPath: '@/features/sales/components/QuotationManager', canonical: '@/features/sales/quotations/components/QuotationManager' },
  { name: 'ReturnsManager', oldPath: '@/features/sales/components/ReturnsManager', canonical: '@/features/sales/returns/components/ReturnsManager' }
];

console.log('=== CONSUMER AUDIT FOR 13 WRAPPERS ===');
for (const w of wrappers) {
  const matches = [];
  for (const f of allFiles) {
    if (f.includes(w.name + '.tsx')) continue;
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes(w.oldPath) || c.includes('/components/' + w.name)) {
      matches.push(f.replace('frontend/src/', '').replace('frontend\\src\\', ''));
    }
  }
  console.log(`- ${w.name}: imported in ${matches.length} files:`);
  matches.forEach(m => console.log(`    -> ${m}`));
}
