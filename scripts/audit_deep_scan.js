const fs = require('fs');
const path = require('path');

function getAllFiles(dir, filter) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'bin' && file !== 'obj') {
        results = results.concat(getAllFiles(filePath, filter));
      }
    } else if (!filter || filter(filePath)) {
      results.push(filePath);
    }
  });
  return results;
}

console.log('=== 1. DISCOVERING FRONTEND PAGES ===');
const appDir = path.join(__dirname, '..', 'frontend', 'src', 'app');
const pageFiles = getAllFiles(appDir, f => f.endsWith('page.tsx'));
console.log(`Found ${pageFiles.length} page.tsx files.`);

const frontendPages = pageFiles.map(filePath => {
  const relPath = path.relative(appDir, filePath).replace(/\\/g, '/');
  let route = '/' + relPath.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
  
  // Clean up route groups like (marketing), (auth) etc.
  const routeParts = route.split('/').filter(p => !p.startsWith('(') || !p.endsWith(')'));
  const cleanRoute = '/' + routeParts.join('/');

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract imports
  const importMatches = [...content.matchAll(/import\s+.*?from\s+['"](.*?)['"]/g)].map(m => m[1]);
  
  // Extract API calls / endpoints
  const apiMatches = [...content.matchAll(/(?:\/api\/[a-zA-Z0-9_\-\/]+|apiClient\.[a-z]+\(['"`]([^'"`]+)|fetch\(['"`]([^'"`]+))/g)]
    .map(m => m[1] || m[2] || m[0])
    .filter(Boolean);

  // Check for hardcoding patterns
  const hasHardcodedArrays = /const\s+[a-zA-Z0-9_]+Options\s*=\s*\[|const\s+[a-zA-Z0-9_]+Columns\s*=\s*\[|\[\s*\{\s*(?:label|title|name|id|value):/i.test(content);
  const hasStaticBadges = /status\s*===\s*['"][a-zA-Z0-9_]+['"]|case\s*['"](Active|Pending|Approved|Rejected|Draft|Paid|Cancelled)['"]/i.test(content);
  const hasInlineForms = /<form|<input|<select|<textarea/i.test(content);
  const hasErpListView = /useErpListView|ErpTable|DataTable/i.test(content);
  const hasWorkflowButtons = /(?:Approve|Reject|Submit|Cancel|Workflow)/i.test(content);
  const hasKpiCards = /Kpi|Card|Stat|Widget|Metric/i.test(content);

  // Page classification
  let pageType = 'TYPE B — CRUD page';
  if (cleanRoute.startsWith('/docs') || cleanRoute === '/' || cleanRoute.startsWith('/pricing') || cleanRoute.startsWith('/features') || cleanRoute.startsWith('/contact') || cleanRoute.startsWith('/about') || cleanRoute.startsWith('/privacy') || cleanRoute.startsWith('/terms')) {
    pageType = 'TYPE A — Fully static';
  } else if (cleanRoute.includes('dashboard') || cleanRoute.includes('analytics')) {
    pageType = 'TYPE E — Dashboard';
  } else if (cleanRoute.includes('workflow') || cleanRoute.includes('approvals')) {
    pageType = 'TYPE F — Workflow page';
  } else if (cleanRoute.includes('security') || cleanRoute.includes('roles') || cleanRoute.includes('permissions') || cleanRoute.includes('users') || cleanRoute.includes('policy')) {
    pageType = 'TYPE K — Security page';
  } else if (cleanRoute.includes('settings') || cleanRoute.includes('configuration') || cleanRoute.includes('schema') || cleanRoute.includes('builder')) {
    pageType = 'TYPE J — Configuration page';
  } else if (cleanRoute.includes('reports')) {
    pageType = 'TYPE I — Report/Analytics';
  } else if (cleanRoute.includes('departments') || cleanRoute.includes('designations') || cleanRoute.includes('currencies') || cleanRoute.includes('branches') || cleanRoute.includes('cost-centers') || cleanRoute.includes('categories') || cleanRoute.includes('locations')) {
    pageType = 'TYPE G — Master-data page';
  } else if (cleanRoute.includes('payroll') || cleanRoute.includes('invoice') || cleanRoute.includes('orders') || cleanRoute.includes('journal') || cleanRoute.includes('payments') || cleanRoute.includes('reconciliation') || cleanRoute.includes('transfer')) {
    pageType = 'TYPE H — Transaction page';
  } else if (hasErpListView) {
    pageType = 'TYPE D — Table/list page';
  } else if (hasInlineForms) {
    pageType = 'TYPE C — Form page';
  }

  // Derive module & submodule
  const segments = cleanRoute.replace(/^\//, '').split('/');
  const moduleName = segments[0] || 'Platform';
  const submodule = segments[1] || 'General';
  const feature = segments.slice(2).join('/') || segments[1] || 'Overview';

  // Hardcoding level & scores
  let hardcodingScore = 30;
  if (hasHardcodedArrays) hardcodingScore += 35;
  if (hasStaticBadges) hardcodingScore += 15;
  if (hasInlineForms) hardcodingScore += 15;
  if (hardcodingScore > 95) hardcodingScore = 95;

  let metadataReadiness = 35;
  if (hasErpListView) metadataReadiness += 30;
  if (!hasHardcodedArrays) metadataReadiness += 15;
  if (metadataReadiness > 90) metadataReadiness = 90;

  const reusabilityScore = hasErpListView ? 75 : 45;
  const architectureScore = 70;
  const securityQuality = cleanRoute.startsWith('/(marketing)') ? 90 : 80;
  const apiQuality = apiMatches.length > 0 ? 80 : 50;

  let migrationPriority = 'P2';
  if (pageType === 'TYPE E — Dashboard' || cleanRoute.includes('employees') || cleanRoute.includes('inventory') || cleanRoute.includes('invoices')) {
    migrationPriority = 'P1';
  } else if (pageType === 'TYPE G — Master-data page') {
    migrationPriority = 'P2';
  } else if (pageType === 'TYPE J — Configuration page' || pageType === 'TYPE K — Security page') {
    migrationPriority = 'P0';
  } else if (pageType === 'TYPE A — Fully static') {
    migrationPriority = 'P4';
  }

  return {
    filePath: 'frontend/src/app/' + relPath,
    route: cleanRoute,
    originalRelPath: relPath,
    module: moduleName.toUpperCase(),
    submodule: submodule.charAt(0).toUpperCase() + submodule.slice(1),
    feature: feature,
    pageType,
    hasHardcodedArrays,
    hasStaticBadges,
    hasErpListView,
    hasWorkflowButtons,
    apiMatches: [...new Set(apiMatches)],
    scores: {
      metadataReadiness,
      hardcodingScore,
      reusabilityScore,
      architectureScore,
      securityQuality,
      apiQuality
    },
    migrationPriority,
    riskLevel: pageType === 'TYPE H — Transaction page' ? 'High' : (pageType === 'TYPE E — Dashboard' ? 'Medium' : 'Low')
  };
});

console.log('=== 2. DISCOVERING BACKEND CONTROLLERS & ENDPOINTS ===');
const backendDir = path.join(__dirname, '..', 'Backend');
const controllerFiles = getAllFiles(backendDir, f => f.endsWith('Controller.cs'));
console.log(`Found ${controllerFiles.length} controller files.`);

const backendControllers = controllerFiles.map(filePath => {
  const relPath = path.relative(backendDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Controller Class Name
  const classMatch = content.match(/public\s+class\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, '.cs');
  
  // Route attribute
  const routeAttrMatch = content.match(/\[Route\((.*?)\)\]/);
  const routeTemplate = routeAttrMatch ? routeAttrMatch[1].replace(/["']/g, '') : 'api/[controller]';
  
  // Authorize attribute
  const authorizeMatches = [...content.matchAll(/\[Authorize(?:\((.*?)\))?\]/g)].map(m => m[1] || 'Default');
  
  // Actions & methods
  const actionMatches = [...content.matchAll(/\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)(?:\((.*?)\))?\][\s\r\n]+public\s+(?:async\s+)?(?:Task<)?([a-zA-Z0-9_<>,?\s]+)>?\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/g)];
  
  const endpoints = actionMatches.map(m => {
    const verb = m[1].replace('Http', '').toUpperCase();
    const subRoute = m[2] ? m[2].replace(/["']/g, '') : '';
    const returnType = m[3].trim();
    const actionName = m[4];
    const params = m[5].trim();
    return {
      verb,
      subRoute,
      actionName,
      returnType,
      params
    };
  });

  // Check module from path
  let moduleName = 'Core';
  const parts = relPath.split('/');
  if (parts.includes('Modules')) {
    const modIdx = parts.indexOf('Modules');
    moduleName = parts[modIdx + 1];
  } else if (parts.includes('UabIndia.Identity')) {
    moduleName = 'Identity';
  } else if (parts.includes('UabIndia.Billing')) {
    moduleName = 'Billing';
  }

  // Check injected services
  const ctorMatch = content.match(/public\s+[a-zA-Z0-9_]+\(([\s\S]*?)\)/);
  const injected = ctorMatch ? ctorMatch[1].split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean) : [];

  return {
    filePath: 'Backend/' + relPath,
    className,
    moduleName,
    routeTemplate,
    authorization: authorizeMatches,
    endpointsCount: endpoints.length,
    endpoints,
    injected
  };
});

console.log('=== 3. DISCOVERING DATABASE ENTITIES & DBCONTEXTS ===');
const dbContextFiles = getAllFiles(backendDir, f => f.endsWith('DbContext.cs'));
let dbSets = [];

dbContextFiles.forEach(dbFile => {
  const content = fs.readFileSync(dbFile, 'utf-8');
  const matches = [...content.matchAll(/public\s+(?:virtual\s+)?DbSet<([a-zA-Z0-9_]+)>\s+([a-zA-Z0-9_]+)\s*\{/g)];
  matches.forEach(m => {
    dbSets.push({
      dbContext: path.basename(dbFile),
      entity: m[1],
      dbSet: m[2]
    });
  });
});
console.log(`Found ${dbSets.length} DbSets across ${dbContextFiles.length} DbContexts.`);

// Entity files analysis
const entityFiles = getAllFiles(backendDir, f => {
  return f.endsWith('.cs') && (f.includes('Entities') || f.includes('Models') || f.includes('Domain')) && !f.endsWith('Controller.cs') && !f.endsWith('DbContext.cs');
});

const entityDetails = entityFiles.map(filePath => {
  const relPath = path.relative(backendDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');
  const classMatch = content.match(/public\s+(?:partial\s+)?class\s+([a-zA-Z0-9_]+)(?:\s*:\s*([a-zA-Z0-9_,\s]+))?/);
  if (!classMatch) return null;
  const entityName = classMatch[1];
  const baseClasses = classMatch[2] ? classMatch[2].split(',').map(s => s.trim()) : [];
  
  const hasTenantId = /TenantId/i.test(content);
  const hasCompanyId = /CompanyId/i.test(content);
  const hasProjectId = /ProjectId/i.test(content);
  const hasSoftDelete = /IsDeleted/i.test(content);
  const hasAuditFields = /CreatedBy|CreatedAt|UpdatedBy|UpdatedAt/i.test(content);

  return {
    filePath: 'Backend/' + relPath,
    entityName,
    baseClasses,
    hasTenantId,
    hasCompanyId,
    hasProjectId,
    hasSoftDelete,
    hasAuditFields
  };
}).filter(Boolean);

console.log(`Discovered ${entityDetails.length} entity model files.`);

// Compile output
const result = {
  summary: {
    totalPages: frontendPages.length,
    totalControllers: backendControllers.length,
    totalEndpoints: backendControllers.reduce((acc, c) => acc + c.endpointsCount, 0),
    totalDbSets: dbSets.length,
    totalEntities: entityDetails.length,
    scannedAt: new Date().toISOString()
  },
  frontendPages,
  backendControllers,
  dbSets,
  entityDetails
};

fs.writeFileSync(path.join(__dirname, 'discovery_output.json'), JSON.stringify(result, null, 2));
console.log('Discovery output saved to scripts/discovery_output.json');
