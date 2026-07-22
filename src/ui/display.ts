/* HiDPI(Retina)対応。
   キャンバスの実バッファを端末ピクセル密度(DPR)倍で確保し、各シーンのカメラを
   DPR 倍ズームすることで、コードは今まで通り論理座標(480×800)のまま、
   文字・ベクター描画が実ピクセル密度で描かれる(iPad/iPhoneのぼやけ解消)。

   ルール:
   - シーンの create() 冒頭で setupHiDpi(this) を呼ぶ
   - ポインタ座標は p.x/p.y ではなく p.worldX/p.worldY を使う
     (p.x はキャンバス座標なので DPR>1 で論理座標とズレる)
   - カメラの zoom をいじる演出は「現在値からの相対」で書く(effects.cameraPulse 参照) */
import Phaser from 'phaser';
import { GAME_H, GAME_W } from './theme';

/** 端末ピクセル比。3倍機でもテクスチャメモリと相談して2まで */
export const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

/** シーンのカメラを DPR ズームして論理座標系を維持する */
export function setupHiDpi(scene: Phaser.Scene): void {
  if (DPR === 1) return;
  const cam = scene.cameras.main;
  cam.setZoom(DPR);
  cam.centerOn(GAME_W / 2, GAME_H / 2);
}

/** Text 生成のデフォルト解像度を DPR にする(文字・絵文字のラスタライズを実ピクセルで行う)。
    ゲーム起動前に一度だけ呼ぶ。数百箇所の add.text を触らずに済ませるためのフック */
export function installHiDpiText(): void {
  if (DPR === 1) return;
  // GameObjectFactory.text をラップして setResolution を差し込む(型定義には現れない差し替え)
  const proto = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
    text: (...args: unknown[]) => Phaser.GameObjects.Text;
  };
  const orig = proto.text;
  proto.text = function (this: unknown, ...args: unknown[]): Phaser.GameObjects.Text {
    const t = orig.apply(this as Phaser.GameObjects.GameObjectFactory, args);
    t.setResolution(DPR);
    return t;
  };
}
