/* 地図の ラベルが かさならない ように 場所を ずらす(Phaser 非依存の 純ロジック)。

   にっぽん地図は 西日本が こみあって いて、「ちゅうぶ」の 文字の 上に
   きんき の アイコンが のる など、どれが どれだか わからなく なって いた。
   ラベルの 場所を 1つずつ 手で ずらすと、県や エリアが 増えた とき また こわれる。
   ので「かさなって いたら おしのける」を くりかえす しくみに する。

   おしのける 向きは 「かさなりが 小さい ほう」。よこに 少しだけ かさなって
   いる なら よこへ、たてに 少しだけ なら たてへ。そのほうが もとの 場所から
   はなれずに すむ。 */

export interface LabelBox {
  id: string;
  /** ラベルの まんなか(はじめは 置きたい ばしょ) */
  x: number;
  y: number;
  /** ラベルの 大きさ */
  w: number;
  h: number;
  /** ラベルが さす ばしょ(引き出し線の さきっぽ)。ずらす ときは 動かさない */
  ax: number;
  ay: number;
}

export interface LabelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** くりかえす 回数の 上限。これ以上 ゆらしても だいたい 変わらない */
const MAX_PASSES = 80;
/** ラベルどうしの すきま(px) */
const DEFAULT_GAP = 4;

const clamp = (v: number, lo: number, hi: number): number => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/**
 * かさなりを ほどいた ラベルの 場所を かえす(もとの配列は こわさない)。
 * 入れた 順に 同じ 結果が でる(乱数を つかわない)ので、テストで 固定できる。
 */
export function layoutLabels(items: LabelBox[], bounds: LabelBounds, gap: number = DEFAULT_GAP): LabelBox[] {
  const out = items.map((i) => ({ ...i }));
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let moved = false;
    for (let a = 0; a < out.length; a++) {
      for (let b = a + 1; b < out.length; b++) {
        const A = out[a];
        const B = out[b];
        const overX = (A.w + B.w) / 2 + gap - Math.abs(A.x - B.x);
        const overY = (A.h + B.h) / 2 + gap - Math.abs(A.y - B.y);
        if (overX <= 0 || overY <= 0) continue; // かさなって いない
        moved = true;
        if (overY <= overX) {
          const d = overY / 2;
          const s = A.y <= B.y ? -1 : 1;
          A.y += d * s;
          B.y -= d * s;
        } else {
          const d = overX / 2;
          const s = A.x <= B.x ? -1 : 1;
          A.x += d * s;
          B.x -= d * s;
        }
      }
    }
    for (const it of out) {
      it.x = clamp(it.x, bounds.minX + it.w / 2, bounds.maxX - it.w / 2);
      it.y = clamp(it.y, bounds.minY + it.h / 2, bounds.maxY - it.h / 2);
    }
    if (!moved) break;
  }
  return out;
}

/** ラベルが さす ばしょから どれだけ はなれたか。
    ここが 大きい ラベルにだけ 引き出し線を ひく(近ければ 線は じゃま) */
export function leaderNeeded(box: LabelBox, minDist = 14): boolean {
  return Math.hypot(box.x - box.ax, box.y - box.ay) > minDist;
}

/** 2つの ラベルが かさなって いるか(テストと 自己点検に つかう) */
export function overlaps(a: LabelBox, b: LabelBox, gap = 0): boolean {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;
}
