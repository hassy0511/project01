/* PWA用アイコンPNGをSVGから書き出す(Playwrightでラスタライズ)。
   使い方: node scripts/gen-icons.mjs
   出力先: public/icons/ */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const CHROMIUM_PATH =
  process.env.MQ_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const OUT_DIR = 'public/icons';
fs.mkdirSync(OUT_DIR, { recursive: true });

const SIZES_ANY = [512, 192, 180, 167, 152, 120, 32, 16];
const SIZES_MASKABLE = [512, 192];

const browserShared = await chromium.launch({ executablePath: CHROMIUM_PATH });

async function renderShared(svgPath, size, outPath) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const page = await browserShared.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;padding:0;width:${size}px;height:${size}px;">${svg}</body></html>`,
  );
  await page.evaluate((s) => {
    const el = document.querySelector('svg');
    el.setAttribute('width', String(s));
    el.setAttribute('height', String(s));
  }, size);
  await page.locator('svg').screenshot({ path: outPath });
  await page.close();
}

for (const size of SIZES_ANY) {
  const out = path.join(OUT_DIR, `icon-${size}.png`);
  await renderShared('scripts/icon.svg', size, out);
  console.log('wrote', out);
}
for (const size of SIZES_MASKABLE) {
  const out = path.join(OUT_DIR, `icon-maskable-${size}.png`);
  await renderShared('scripts/icon-maskable.svg', size, out);
  console.log('wrote', out);
}

await browserShared.close();
console.log('done');
