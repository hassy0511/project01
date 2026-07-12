/* E2E ランナー: vite preview(dist/ 配信)を起動して playthrough を実行する。
   事前に vite build が必要(npm run test:e2e が面倒を見る) */
import { spawn } from 'node:child_process';

const PORT = 4273;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'pipe',
});
server.stderr.on('data', (d) => process.stderr.write(d));

const waitPort = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/project01/`);
      if (res.ok) return;
    } catch {
      /* まだ起動中 */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('preview server did not start');
};

let code = 1;
try {
  await waitPort();
  code = await new Promise((resolve) => {
    const t = spawn('node', [new URL('./playthrough.mjs', import.meta.url).pathname], {
      stdio: 'inherit',
      env: { ...process.env, MQ_BASE_URL: `http://localhost:${PORT}/project01/` },
    });
    t.on('exit', (c) => resolve(c ?? 1));
  });
} finally {
  server.kill();
}
process.exit(code);
