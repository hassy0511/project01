/* =====================================================
   セーブの バックアップ(書き出し / 読みこみ)。
   Phaser 非依存の 純ロジック(ファイルの ダウンロード・選択は ui 側で やる)。

   ねらい: セーブは 端末の localStorage に 1つだけ で、ブラウザの データ消去や
   機種変えで 47県ぶんの 進みが きえて しまう。ファイルに のこして おけば
   おうちのひとが いつでも もどせる(docs/STORE_REVIEW.md ST-2)。

   封筒(envelope)の 形:
     { app: 'meisanquest', v: 1, at: <書き出した時刻ms>, save: <SaveState> }
   - app と v で 「うちの セーブファイルか」を 見わける
   - save の なかみは sanitizeState で キーごとに 型を たしかめて ならす
     (こわれた ファイルや 古い 形でも、なおせる ところだけ 取りこむ)
   ===================================================== */
import { sanitizeState, type SaveState } from './state';

/** 封筒の しるし(localStorage キーと 同じ 内部名。改名しても ここは 変えない) */
export const BACKUP_APP = 'meisanquest';
/** 封筒の 版。セーブの 形が 大きく 変わったら 上げる(読みこみは 古い 版も 受ける) */
export const BACKUP_VERSION = 1;

export interface BackupEnvelope {
  app: string;
  v: number;
  at: number;
  save: SaveState;
}

/** セーブを ファイルに 書く ための 文字列に する(人が 見ても 分かる JSON) */
export function exportBackup(state: SaveState, now: number): string {
  const env: BackupEnvelope = { app: BACKUP_APP, v: BACKUP_VERSION, at: now, save: state };
  return JSON.stringify(env, null, 2);
}

/** バックアップの ファイル名。日づけ入りで 「いつの ものか」が 見て 分かる */
export function backupFileName(now: Date): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `harehare-save-${y}${m}${d}.json`;
}

/** 読みこみの 結果。だめな ときは 理由つき(ui が トーストで 出しわける) */
export type ImportResult = { ok: true; save: SaveState; at: number } | { ok: false; reason: 'notOurs' | 'broken' };

/** ファイルの 文字列から セーブを 取り出す。
    - JSON で ない / 封筒の しるしが ちがう → だめ
    - save の なかみは sanitizeState で ならす(型の あわない ところは 既定値) */
export function importBackup(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'broken' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'broken' };
  const env = parsed as Record<string, unknown>;
  if (env.app !== BACKUP_APP) return { ok: false, reason: 'notOurs' };
  if (typeof env.v !== 'number' || env.v < 1 || env.v > BACKUP_VERSION) return { ok: false, reason: 'notOurs' };
  const save = sanitizeState(env.save);
  if (!save) return { ok: false, reason: 'broken' };
  const at = typeof env.at === 'number' ? env.at : 0;
  return { ok: true, save, at };
}
