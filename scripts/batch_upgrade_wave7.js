const fs = require('fs');
const path = require('path');

const targetPages = [
  { file: 'frontend/src/app/(protected)/reports/compliance/page.tsx', func: 'ComplianceReportsPage', key: 'reports.compliance' },
  { file: 'frontend/src/app/(protected)/reports/financial/page.tsx', func: 'FinancialReportsPage', key: 'reports.financial' },
  { file: 'frontend/src/app/(protected)/reports/hr/page.tsx', func: 'HrReportsPage', key: 'reports.hr' },
  { file: 'frontend/src/app/(protected)/reports/operations/page.tsx', func: 'BusinessOperationsReportsPage', key: 'reports.operations' },
  { file: 'frontend/src/app/(protected)/reports/payroll/page.tsx', func: 'PayrollReportsPage', key: 'reports.payroll' },
  { file: 'frontend/src/app/(protected)/hrms/assessments/page.tsx', func: 'AssessmentsPage', key: 'hrms.assessments' },
  { file: 'frontend/src/app/(protected)/hrms/certificates/page.tsx', func: 'CertificatesPage', key: 'hrms.certificates' },
  { file: 'frontend/src/app/(protected)/hrms/screening-results/page.tsx', func: 'ScreeningResultsPage', key: 'hrms.screening-results' },
  { file: 'frontend/src/app/(protected)/hrms/screening-schedule/page.tsx', func: 'ScreeningSchedulePage', key: 'hrms.screening-schedule' },
  { file: 'frontend/src/app/(protected)/hrms/training/page.tsx', func: 'TrainingLearningPage', key: 'hrms.training' },
  { file: 'frontend/src/app/(protected)/licensing/billing-history/page.tsx', func: 'LicensingBillingHistoryPage', key: 'licensing.billing-history' },
  { file: 'frontend/src/app/(protected)/licensing/catalog/page.tsx', func: 'ModuleCatalogPage', key: 'licensing.catalog' },
  { file: 'frontend/src/app/(protected)/licensing/integrations/page.tsx', func: 'ApiKeysPage', key: 'licensing.integrations' },
  { file: 'frontend/src/app/(protected)/licensing/subscriptions/page.tsx', func: 'SubscriptionsPage', key: 'licensing.subscriptions' },
  { file: 'frontend/src/app/(protected)/licensing/usage/page.tsx', func: 'LicensingUsagePage', key: 'licensing.usage' },
  { file: 'frontend/src/app/(protected)/administration/backup/page.tsx', func: 'BackupRecoveryPage', key: 'administration.backup' },
  { file: 'frontend/src/app/(protected)/administration/contact-submissions/page.tsx', func: 'ContactSubmissionsPage', key: 'administration.contact-submissions' },
  { file: 'frontend/src/app/(protected)/administration/data-management/page.tsx', func: 'DataManagementPage', key: 'administration.data-management' },
  { file: 'frontend/src/app/(protected)/administration/developer-center/page.tsx', func: 'DeveloperCenterPage', key: 'administration.developer-center' },
  { file: 'frontend/src/app/(protected)/administration/feature-flags/page.tsx', func: 'FeatureFlagsPage', key: 'administration.feature-flags' },
  { file: 'frontend/src/app/(protected)/administration/holiday-calendar/page.tsx', func: 'HolidayCalendarPage', key: 'administration.holiday-calendar' },
  { file: 'frontend/src/app/(protected)/administration/integrations/connectors/page.tsx', func: 'ConnectorsPage', key: 'administration.connectors' },
  { file: 'frontend/src/app/(protected)/administration/notification-templates/page.tsx', func: 'NotificationTemplatesPage', key: 'administration.notification-templates' }
];

targetPages.forEach(({ file, func, key }) => {
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

  // 1. Add DynamicPage import
  if (!content.includes('import { DynamicPage }')) {
    content = 'import { DynamicPage } from "@/components/dynamic/DynamicPage";\n' + content;
  }

  // 2. Rename export default function [func] to function Legacy[func]
  const targetExport = `export default function ${func}`;
  const legacyFunc = `Legacy${func}`;
  if (!content.includes(targetExport)) {
    console.error(`Export ${targetExport} not found in ${file}`);
    return;
  }
  content = content.replace(targetExport, `function ${legacyFunc}`);

  // 3. Append DynamicPage wrapper
  const wrapper = `\n\nexport default function ${func}() {\n  return (\n    <DynamicPage\n      pageKey="${key}"\n      fallback={<${legacyFunc} />}\n      renderMode="auto"\n    />\n  );\n}\n`;
  content = content.trimEnd() + wrapper;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Successfully upgraded: ${file} -> ${key}`);
});
