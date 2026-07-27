import { chromium } from 'playwright';
const { CHROMIUM_PATH } = await import('/home/user/project01/e2e/helpers.mjs');
const url = process.argv[2] ?? 'http://localhost:5173/project01/iconsheet.html';
const out = process.argv[3] ?? '/home/user/project01/e2e/shots/icon-sheet.png';
const b = await chromium.launch({ executablePath: CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 900, height: 1400 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
p.on('response', (r) => {
  if (r.status() >= 400) console.log(r.status(), r.url());
});
await p.goto(url);
await p.waitForTimeout(4000);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('saved', out);
