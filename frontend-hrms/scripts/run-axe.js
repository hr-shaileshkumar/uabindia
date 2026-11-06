const { chromium } = require('playwright');
const fs = require('fs');

(async ()=>{
  const base = process.env.BASE_URL || 'http://localhost:3003';
  const outDir = 'reports/axe';
  if(!fs.existsSync('reports')) fs.mkdirSync('reports');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  const pages = [
    { path: '/module/hrms/employee-master', name: 'employee-list' },
    { path: '/module/hrms/employee-master/create', name: 'employee-create' },
    { path: '/module/hrms/employee-master/edit/1', name: 'employee-edit-1' },
    { path: '/module/hrms/employee-master/view/1', name: 'employee-view-1' }
  ];

  // load axe-core from unpkg and run it in the page context
  for(const p of pages){
    const url = base + p.path;
    try{
      console.log('Navigating to', url);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.7.2/axe.min.js' });
      const result = await page.evaluate(async () => {
        return await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
      });
      fs.writeFileSync(`${outDir}/${p.name}.json`, JSON.stringify(result, null, 2));
      console.log('Saved axe report for', p.name);
    }catch(e){
      console.error('Axe run failed for', p.path, e.message);
    }
  }

  await browser.close();
  console.log('Axe runs complete. Reports in', outDir);
})();
