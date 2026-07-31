import { chromium } from 'playwright';
import { CHROMIUM_PATH } from '../helpers.mjs';
const BASE = 'http://localhost:4273/project01/';
const OUT = '/tmp/claude-0/-home-user-project01/d96fbbb8-2c76-53c9-80d5-ef58e7c02ee7/scratchpad';
const b = await chromium.launch({ executablePath: CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 480, height: 800 } });
await p.goto(BASE); await p.waitForSelector('canvas');
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForSelector('canvas');
await p.waitForTimeout(1200);
await p.evaluate(() => { window.__mqAdmin.skipGuides(); window.__mqAdmin.festAllButOne(); });
await p.waitForTimeout(400);
await p.evaluate(() => window.__game.scene.start('RegionScene'));
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/region.png` });
for (const r of ['chubu','kinki','chugoku','shikoku','tohoku','kanto','kyushu']) {
  await p.evaluate((id) => window.__game.scene.start('MapScene', { regionId: id }), r);
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/map-${r}.png` });
}
await b.close(); process.exit(0);
