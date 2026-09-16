const fs = require('fs');
const path = require('path');

const targetPages = [
  { file: 'frontend/src/app/(protected)/notifications/page.tsx', func: 'NotificationsInboxPage', key: 'notifications.inbox' },
  { file: 'frontend/src/app/(protected)/documents/page.tsx', func: 'DocumentVaultPage', key: 'documents.vault' },
  { file: 'frontend/src/app/(protected)/administration/recycle-bin/page.tsx', func: 'RecycleBinPage', key: 'administration.recycle-bin' },
  { file: 'frontend/src/app/(protected)/administration/schema-manager/page.tsx', func: 'SchemaManagerPage', key: 'administration.schema-manager' },
  { file: 'frontend/src/app/(protected)/administration/security/sessions/page.tsx', func: 'SecuritySessionsPage', key: 'administration.security-sessions' },
  { file: 'frontend/src/app/(protected)/security/access-logs/page.tsx', func: 'AccessLogsPage', key: 'security.access-logs' },
  { file: 'frontend/src/app/(protected)/security/ip-restrictions/page.tsx', func: 'IpRestrictionsPage', key: 'security.ip-restrictions' },
  { file: 'frontend/src/app/(protected)/security/password-policies/page.tsx', func: 'PasswordPoliciesPage', key: 'security.password-policies' },
  { file: 'frontend/src/app/(protected)/security/multi-factor-authentication/page.tsx', func: 'MultiFactorAuthenticationPage', key: 'security.multi-factor-authentication' },
  { file: 'frontend/src/app/(protected)/security/single-sign-on/page.tsx', func: 'SingleSignOnPage', key: 'security.single-sign-on' },
  { file: 'frontend/src/app/(protected)/communication/announcements/page.tsx', func: 'AnnouncementsPage', key: 'communication.announcements' },
  { file: 'frontend/src/app/(protected)/communication/email-templates/page.tsx', func: 'CommunicationEmailTemplatesPage', key: 'communication.email-templates' },
  { file: 'frontend/src/app/(protected)/communication/sms-templates/page.tsx', func: 'CommunicationSmsTemplatesPage', key: 'communication.sms-templates' },
  { file: 'frontend/src/app/(protected)/helpdesk/faq/page.tsx', func: 'HelpdeskFaqPage', key: 'helpdesk.faq' },
  { file: 'frontend/src/app/(protected)/helpdesk/escalations/page.tsx', func: 'HelpdeskEscalationsPage', key: 'helpdesk.escalations' },
  { file: 'frontend/src/app/(protected)/payroll/arrears/page.tsx', func: 'PayrollArrearsPage', key: 'payroll.arrears' },
  { file: 'frontend/src/app/(protected)/payroll/reimbursements/page.tsx', func: 'PayrollReimbursementsPage', key: 'payroll.reimbursements' },
  { file: 'frontend/src/app/(protected)/payroll/statutory/page.tsx', func: 'PayrollStatutoryPage', key: 'payroll.statutory' }
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
