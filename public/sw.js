/* オフライン対応の簡易サービスワーカー。
   ビルド成果物のハッシュ付きファイル名を事前列挙する仕組みは持たず、
   「使ったファイルをその場でキャッシュする」ランタイムキャッシュ方式にしている
   (Vite の出力ファイル名が毎ビルドで変わるため、プリキャッシュ一覧を持つと
   デプロイのたびに更新が要るので採用しない)。

   方針:
   - ナビゲーション(index.html): network-first。オフライン時のみキャッシュへフォールバック
   - それ以外(JS/CSS/画像/JSON等): stale-while-revalidate
     (キャッシュがあれば即返しつつ裏で更新。無ければネットワーク取得してキャッシュに保存)
   - 新デプロイのたびに CACHE_NAME を上げて 旧キャッシュを掃除する(main.ts 側で
     バージョン文字列を注入している場合は差し替える運用も可。今は固定値+手動更新) */

const CACHE_NAME = 'meisanquest-v1';

self.addEventListener('install', (event) => {
  // ドキュメント自体を明示的にプリキャッシュする: 初回ロードの navigate リクエストは
  // SW登録より前に発生するため fetch イベントを素通りし、何もしなければ絶対に
  // キャッシュされない(=「一度開けばオフラインでも起動できる」が成立しない)
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部リソースは扱わない(そもそも存在しない想定)

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(
          () =>
            caches
              .match(req)
              .then((cached) => cached ?? caches.match('./index.html'))
              // 万一 index.html すら無ければ、素の 200 応答を返して真っ白エラーだけは避ける
              .then((cached) => cached ?? new Response('オフラインです', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })),
        ),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
