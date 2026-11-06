/**
 * Uabindia HRMS Full-Stack Route & Navigation Smoke Test Suite
 * Big Tech automated verification of all application routes, component resolution,
 * and page layout bindings.
 */

import fs from 'fs'
import path from 'path'

console.log('=== UABINDIA HRMS ENTERPRISE ROUTE SMOKE TEST ===\n')

const baseDir = fs.existsSync('Frontend/src/App.jsx') ? 'Frontend' : '.'
const appPath = path.join(baseDir, 'src/App.jsx')
const navPathFile = path.join(baseDir, 'src/layout/navigation.js')

const appContent = fs.readFileSync(appPath, 'utf8')
const lazyRegex = /const\s+(\w+)\s*=\s*React\.lazy\(\(\)\s*=>\s*import\(['"](.+?)['"]\)\)/g
const matches = [...appContent.matchAll(lazyRegex)]

console.log(`1. Verifying ${matches.length} Lazy-Loaded Route Components...`)
let missingCount = 0
const resolvedComponents = []

for (const match of matches) {
  const [, componentName, importPath] = match
  const cleanPath = importPath.startsWith('./') ? importPath.slice(2) : importPath
  const fullBase = path.join(baseDir, 'src', cleanPath)

  const candidates = [
    fullBase + '.jsx',
    fullBase + '.js',
    path.join(fullBase, 'index.jsx'),
    path.join(fullBase, 'index.js')
  ]

  const found = candidates.find(p => fs.existsSync(p))
  if (found) {
    resolvedComponents.push({ componentName, importPath, found })
  } else {
    console.error(`  ✗ MISSING: ${componentName} -> ${importPath}`)
    missingCount++
  }
}

if (missingCount === 0) {
  console.log(`  ✓ All ${resolvedComponents.length} route components exist and resolve cleanly on disk.`)
} else {
  console.error(`  ✗ ${missingCount} route components are missing!`)
  process.exit(1)
}

// 2. Verify all Sidebar Navigation Links map to valid routes
console.log('\n2. Verifying Sidebar Navigation Link Map...')
const navContent = fs.readFileSync(navPathFile, 'utf8')
const pathMatch = [...navContent.matchAll(/path:\s*['"](.+?)['"]/g)]
const navPaths = [...new Set(pathMatch.map(m => m[1]))]

console.log(`  Found ${navPaths.length} unique navigation links in Sidebar menu.`)

// Check each navigation path against App.jsx route definitions
const routeRegex = /path=["'](.+?)["']/g
const allRoutes = [...appContent.matchAll(routeRegex)].map(m => m[1].replace(/^\//, ''))

let navFailures = 0
for (const navPath of navPaths) {
  const cleanNav = navPath.replace(/^\//, '')
  // Exact match or param pattern match
  const matchesRoute = allRoutes.some(r => {
    if (r === cleanNav) return true
    if (r.includes(':')) {
      const baseR = r.split('/:')[0]
      if (cleanNav.startsWith(baseR)) return true
    }
    return false
  })

  if (matchesRoute) {
    console.log(`  ✓ Route reachable: /${cleanNav}`)
  } else {
    console.warn(`  ⚠ Navigation path might lack explicit Route in App.jsx: /${cleanNav}`)
    navFailures++
  }
}

// 3. Verify Layout Version Badges
console.log('\n3. Verifying LayoutVersionBadge on Core Modules...')
const coreModules = [
  path.join(baseDir, 'src/module/HRMS/EmployeeMaster/EmployeeList.jsx'),
  path.join(baseDir, 'src/module/HRMS/Recruitment/CandidatePipeline.jsx'),
  path.join(baseDir, 'src/module/HRMS/WorkforceMovement/EmployeeTransfer.jsx'),
  path.join(baseDir, 'src/module/HRMS/WorkforceMovement/EmployeePromotion.jsx'),
  path.join(baseDir, 'src/module/HRMS/Leave/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/Attendance/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/Payroll/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/Performance/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/Compliance/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/ExitManagement/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/CompanyMaster/CompanyList.jsx'),
  path.join(baseDir, 'src/module/HRMS/Projects/ProjectsList.jsx'),
  path.join(baseDir, 'src/module/HRMS/Training/TrainingPrograms.jsx'),
  path.join(baseDir, 'src/module/HRMS/SelfService/index.jsx'),
  path.join(baseDir, 'src/module/HRMS/SetupCenter.jsx')
]

let badgeFailures = 0
for (const mod of coreModules) {
  const code = fs.readFileSync(mod, 'utf8')
  if (code.includes('LayoutVersionBadge')) {
    console.log(`  ✓ ${path.basename(path.dirname(mod))}/${path.basename(mod)}: Standardized LayoutVersionBadge attached`)
  } else {
    console.error(`  ✗ ${mod} MISSING LayoutVersionBadge!`)
    badgeFailures++
  }
}

console.log('\n=============================================')
if (missingCount === 0 && navFailures === 0 && badgeFailures === 0) {
  console.log('✓ ALL SMOKE TESTS PASSED! ZERO BROKEN ROUTES.')
  console.log('=============================================\n')
  process.exit(0)
} else {
  console.log(`⚠ Completed with ${navFailures} nav warnings, ${badgeFailures} badge failures.`)
  console.log('=============================================\n')
  process.exit(badgeFailures > 0 ? 1 : 0)
}
