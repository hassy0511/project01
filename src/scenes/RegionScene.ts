/* にほんぜんこく画面: 実形の日本地図(regions-gen.json)を8地方の色分けで表示。
   アクティブな地方(いまは かんとうのみ)をタップすると その地図へ。
   ほかの地方は灰色+雲の「じゅんびちゅう」(エリア解放型の入り口になる画面)。
   もやもやぐも(ストーリー)の「まだ はれていない にっぽん」を見せる場でもある */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { GAME_DATA, type Region } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import {
  activePrefCount,
  harePrefCount,
  isAllHare,
  isRegionComp,
  isRegionOpen,
  playedFestCount,
  regionOpenFlagKey,
} from '../core/state';
import { store, runtimeStory } from '../game/store';
import { layoutLabels, leaderNeeded, type LabelBox } from '../core/labelLayout';
import { getRegionAsset } from '../game/mapData';
import { SFX } from '../audio/sfx';
import { firework } from '../ui/effects';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, Modal, showToast } from '../ui/widgets';
import { addIcon } from '../ui/icons';

const TOP_H = 48;
/** 下部ガイドぶんの余白 */
const BOTTOM_PAD = 170;

/** ふだを 置きたい ばしょ(viewBox座標系)。
    にっぽんは 右上(ほっかいどう)から 左下(きゅうしゅう)へ ななめに ならぶ ので、
    海が あいて いるのは 「左上」と「右下」。ふだは そこへ 逃がし、
    どの エリアの ことかは 引き出し線で 示す。こうすると 列島の かたちが かくれない。
    さいごの 場所は layoutLabels が かさなりを ほどいて 決める */
const LABEL_WANT: Record<string, [number, number]> = {
  tohoku: [250, 70],
  kanto: [370, 310],
  chubu: [250, 175],
  kinki: [300, 380],
  chugoku: [120, 210],
  shikoku: [215, 425],
  kyushu: [75, 380],
};

/** ラベルの 見ため(画面の px)。文字を 白い ふだの 上に のせて 地図から 浮かせる */
const LABEL_PAD_X = 8;
const LABEL_PAD_Y = 6;
const LABEL_ICON = 22;
const LABEL_MEDAL = 16;
/** ラベルどうしの すきま */
const LABEL_GAP = 5;

export class RegionScene extends Phaser.Scene {
  constructor() {
    super('RegionScene');
  }

  create(): void {
    setupHiDpi(this);
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawSea();
    this.buildTop();
    this.drawHareMeter();
    this.drawJapan();

    const guide = makeGuideRow(this, UI_TEXT.region.guide, 'wow', 440);
    guide.container.setPosition(GAME_W / 2, GAME_H - 60 - guide.height / 2);

    // あたらしく ひらいた エリアが あれば 1つだけ おしらせ(E2E では とばす)
    if (!runtimeStory.muted) this.maybeShowRegionOpen();
  }

  /** にっぽん はれメーター: 47県の 長い たびの すすみを 1本で 見せる */
  private drawHareMeter(): void {
    const n = harePrefCount(store.state, GAME_DATA);
    const total = activePrefCount(GAME_DATA);
    const c = this.add.container(GAME_W / 2, TOP_H + 22).setDepth(DEPTH.header - 1);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.88);
    g.lineStyle(2, COLORS.panelLine, 1);
    g.fillRoundedRect(-92, -15, 184, 30, 15);
    g.strokeRoundedRect(-92, -15, 184, 30, 15);
    c.add(g);
    c.add(addIcon(this, -70, 0, 'sun:amber', 22));
    c.add(
      this.add
        .text(10, 0, UI_TEXT.hare.meter(n, total), {
          fontFamily: FONT,
          fontSize: '14px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    // ぜんぶ 晴れた あとの そらは おいわいつづき(ときどき はなび)
    if (isAllHare(store.state, GAME_DATA)) {
      this.time.addEvent({
        delay: 2600,
        loop: true,
        callback: () => firework(this, 60 + Math.random() * (GAME_W - 120), 90 + Math.random() * 120),
      });
    }
  }

  /** あたらしく ひらいた エリアの おしらせ(1回だけ・1度に 1つ)。
      「くもの すきまが ひらいた」という 物語の つづきに する */
  private maybeShowRegionOpen(): void {
    const s = store.state;
    const fresh = GAME_DATA.regions.find(
      (r) =>
        r.active &&
        (r.unlockFests ?? 0) > 0 &&
        this.regionOpen(r) &&
        !s.flags[regionOpenFlagKey(r.id)],
    );
    if (!fresh) return;
    s.flags[regionOpenFlagKey(fresh.id)] = true;
    store.save();
    SFX.fanfare();
    const modal = new Modal(this, UI_TEXT.region.openTitle, true);
    modal.add(addIcon(this, 0, 0, fresh.icon, 58), 62);
    modal.addText(fresh.name, 20);
    const guide = makeGuideRow(this, UI_TEXT.region.openBody(fresh.name), 'cheer');
    modal.add(guide.container, guide.height);
    modal.addButton(UI_TEXT.region.openGo, COLORS.orange, () => {
      modal.close();
      this.scene.start('MapScene', { regionId: fresh.id });
    });
    modal.show();
  }

  private buildTop(): void {
    const c = this.add.container(0, 0).setDepth(DEPTH.header);
    c.add(this.add.rectangle(GAME_W / 2, TOP_H / 2, GAME_W, TOP_H, COLORS.headerBg));
    const back = this.add
      .text(12, TOP_H / 2, UI_TEXT.region.back, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.good,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MapScene'));
    c.add(back);
    c.add(
      this.add
        .text(GAME_W / 2, TOP_H / 2, UI_TEXT.region.title, {
          fontFamily: FONT,
          fontSize: '18px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
  }

  private drawSea(): void {
    const bg = this.add.graphics();
    // ぜんぶ 晴れた あとは そらも うみも ひときわ あかるい(クリアの よいん)
    const clear = isAllHare(store.state, GAME_DATA);
    if (clear) bg.fillGradientStyle(0xd8f4ff, 0xd8f4ff, 0x9fe0f0, 0x9fe0f0, 1);
    else bg.fillGradientStyle(0xbfe9f7, 0xbfe9f7, 0x8fd0e0, 0x8fd0e0, 1);
    bg.fillRect(0, TOP_H, GAME_W, GAME_H - TOP_H);
    for (let i = 0; i < 6; i++) {
      const wave = this.add.graphics();
      wave.lineStyle(2.5, 0xffffff, 0.25);
      const y = TOP_H + 70 + i * 110;
      wave.beginPath();
      for (let x = -20; x <= GAME_W + 20; x += 8) {
        const wy = y + Math.sin(x / 30 + i * 1.7) * 4;
        if (x === -20) wave.moveTo(x, wy);
        else wave.lineTo(x, wy);
      }
      wave.strokePath();
      this.tweens.add({
        targets: wave,
        x: { from: -14, to: 14 },
        duration: 2600 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** かんとうの進捗(かいたく数と 🏮の数) */
  private regionProgress(region: Region): string {
    const prefs = GAME_DATA.prefectures.filter((p) => p.region === region.id && p.active);
    const unlocked = prefs.filter((p) => store.state.unlocked.includes(p.id)).length;
    const fests = prefs.filter((p) => p.festivalId && store.state.fest.includes(p.festivalId)).length;
    let text = UI_TEXT.region.prog(unlocked, prefs.length);
    if (fests > 0) text += ` ${UI_TEXT.region.festCount(fests)}`;
    return text;
  }

  /** 「いってみよう!」を つける エリアを 1つだけ えらぶ。
      ひらいている エリアの うち かいたくが いちばん すすんでいない ところ(=つぎの ぼうけん先)。
      ぜんぶ かいたくずみなら いま いる エリア。7エリアぶん 出すと 地図が うまるので 1つに しぼる */
  private badgeRegionId(): string {
    const open = GAME_DATA.regions.filter((r) => r.active && this.regionOpen(r));
    if (!open.length) return '';
    const rest = (r: Region): number => {
      const prefs = GAME_DATA.prefectures.filter((p) => p.region === r.id && p.active);
      return prefs.filter((p) => !store.state.unlocked.includes(p.id)).length;
    };
    const frontier = open.filter((r) => rest(r) > 0).sort((a, b) => rest(b) - rest(a))[0];
    if (frontier) return frontier.id;
    return store.state.currentRegion ?? open[0].id;
  }

  /* ---------- 実形の日本地図 ---------- */
  private drawJapan(): void {
    const rm = getRegionAsset();
    // はれメーター(TOP_H の 下 30px)の ぶんだけ 地図を 下げる
    const meterH = 34;
    const availH = GAME_H - TOP_H - BOTTOM_PAD - meterH;
    const scale = Math.min((GAME_W - 16) / rm.viewW, availH / rm.viewH);
    const offX = (GAME_W - rm.viewW * scale) / 2;
    const offY = TOP_H + meterH + 10 + (availH - rm.viewH * scale) / 2;
    const root = this.add.container(offX, offY).setScale(scale);
    const badgeId = this.badgeRegionId();

    // 地面(県リングを地方色で塗る。白フチで県境も見える)
    for (const region of GAME_DATA.regions) {
      const rings = rm.polys[region.id];
      if (!rings) continue;
      const color = region.active
        ? Phaser.Display.Color.HexStringToColor(region.color).color
        : COLORS.lockedPref;
      for (const ring of rings) {
        const pts = ring.map((p) => new Phaser.Geom.Point(p.x, p.y));
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.lineStyle(1.4 / scale, 0xffffff, 0.9);
        g.fillPoints(pts, true);
        g.strokePoints(pts, true);
        g.setInteractive(new Phaser.Geom.Polygon(pts), Phaser.Geom.Polygon.Contains);
        g.on('pointerup', () => this.onRegionTap(region));
        root.add(g);
      }
    }

    // じゅんびちゅうの もやもやぐも(地方の 上に。ラベルとは 別位置)
    for (const region of GAME_DATA.regions) {
      const lp = rm.labels[region.id];
      if (!lp || this.regionOpen(region)) continue;
      const cloud = this.add.container(lp[0], lp[1] - 6).setAlpha(0.85).setScale(0.9 / scale);
      const cg = this.add.graphics();
      cg.fillStyle(0xffffff, 1);
      cg.fillEllipse(0, 0, 52, 20);
      cg.fillEllipse(-17, 6, 30, 15);
      cg.fillEllipse(18, 6, 32, 16);
      cloud.add(cg);
      root.add(cloud);
      this.tweens.add({
        targets: cloud,
        x: lp[0] + 8 / scale,
        duration: 2400 + Math.random() * 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.drawRegionLabels(rm, offX, offY, scale, badgeId);
  }

  /* ---------- エリアの ふだ(名前+すすみぐあい) ----------
     まえは 地図と 同じ ものさし(viewBox)の 上に 文字を おいて いた ので、
     西日本が こみあう ところで 「ちゅうぶ」の 上に きんき の アイコンが のり、
     どれが どの エリアか わからなく なって いた。
     いまは
       ・ふだは 画面の ものさしで つくる(文字の 大きさを scale で わらない)
       ・白い ふだに のせて 地図から 浮かせる
       ・かさなったら layoutLabels が おしのける
       ・はなれた ふだからは 引き出し線を ひいて、どの エリアの ことか 示す */
  private drawRegionLabels(
    rm: ReturnType<typeof getRegionAsset>,
    offX: number,
    offY: number,
    scale: number,
    badgeId: string,
  ): void {
    const leaders = this.add.graphics().setDepth(1);
    const groups: { region: Region; c: Phaser.GameObjects.Container; box: LabelBox }[] = [];

    for (const region of GAME_DATA.regions) {
      const lp = rm.labels[region.id];
      if (!lp) continue;
      const open = this.regionOpen(region);
      const [wx, wy] = LABEL_WANT[region.id] ?? lp;
      // さす ばしょ=エリアの まんなか / 置きたい ばしょ=海の あいて いる ところ
      const ax = offX + lp[0] * scale;
      const ay = offY + lp[1] * scale;
      const wantX = offX + wx * scale;
      const wantY = offY + wy * scale;

      const c = this.add.container(0, 0).setDepth(2);
      // 「ほっかいどう・とうほく」のような 長い 名前は 「・」で 2行に する。
      // よこに 長い ふだは 地図を かくして しまう。
      // 文字を 直接 いじらず 折りかえしで やるのは、なまえ そのもの(text)を
      // 変えない ため(さがす ときに 改行が まざると 見つからなく なる)
      const name = this.add
        .text(0, 0, region.name, {
          fontFamily: FONT,
          fontSize: '13px',
          color: open ? TEXT_COLORS.main : TEXT_COLORS.sub,
          fontStyle: 'bold',
          align: 'left',
          lineSpacing: 1,
        })
        .setOrigin(0, 0.5);
      if (region.name.includes('・')) {
        name.setWordWrapCallback((t: string) => {
          const parts = t.split('・');
          return parts.map((s, i) => (i < parts.length - 1 ? `${s}・` : s));
        });
      }
      const subText = open
        ? this.regionProgress(region)
        : region.active && region.unlockFests
          ? UI_TEXT.region.almostOpen(region.unlockFests)
          : '';
      const sub = subText
        ? this.add
            .text(0, 0, subText, {
              fontFamily: FONT,
              fontSize: '10px',
              color: open ? TEXT_COLORS.good : TEXT_COLORS.sub,
              fontStyle: 'bold',
            })
            .setOrigin(0, 0.5)
        : undefined;

      const comp = open && isRegionComp(store.state, GAME_DATA, region.id);
      const iconW = open ? LABEL_ICON + 4 : 0;
      const medalW = comp ? LABEL_MEDAL + 2 : 0;
      const textW = Math.max(name.width, sub?.width ?? 0);
      const w = LABEL_PAD_X * 2 + iconW + textW + medalW;
      const h = LABEL_PAD_Y * 2 + name.height + (sub ? 2 + sub.height : 0);

      // ふだの 中身は 中心ぞろえ(container の まんなかが ふだの まんなか)
      const left = -w / 2 + LABEL_PAD_X;
      const top = -h / 2 + LABEL_PAD_Y;
      const plate = this.add.graphics();
      plate.fillStyle(0xffffff, 0.94);
      plate.lineStyle(2, Phaser.Display.Color.HexStringToColor(region.color).color, 1);
      plate.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      plate.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      c.add(plate);
      if (open) c.add(addIcon(this, left + LABEL_ICON / 2, 0, region.icon, LABEL_ICON));
      name.setPosition(left + iconW, top + name.height / 2);
      c.add(name);
      if (sub) {
        sub.setPosition(left + iconW, top + name.height + 2 + sub.height / 2);
        c.add(sub);
      }
      if (comp) c.add(addIcon(this, w / 2 - LABEL_PAD_X - LABEL_MEDAL / 2, 0, 'medal:gold', LABEL_MEDAL));

      c.setSize(w, h);
      c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
      c.on('pointerup', () => this.onRegionTap(region));
      // 名前の 文字じたいも 押せる ように して おく。
      // ふだ(コンテナ)だけだと、ぱっと 押した ときに 反応しない ことが あった
      // (input.topOnly なので、二重に 走る ことは ない)
      name.setInteractive({ useHandCursor: true });
      name.on('pointerup', () => this.onRegionTap(region));

      if (open && region.id === badgeId) {
        const badge = this.add
          .text(0, -h / 2 - 12, UI_TEXT.region.go, {
            fontFamily: FONT,
            fontSize: '12px',
            color: TEXT_COLORS.white,
            fontStyle: 'bold',
            backgroundColor: '#ff9f40',
            padding: { x: 8, y: 3 },
          })
          .setOrigin(0.5);
        c.add(badge);
        this.tweens.add({
          targets: badge,
          y: badge.y - 6,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      groups.push({ region, c, box: { id: region.id, x: wantX, y: wantY, w, h, ax, ay } });
    }

    // かさなりを ほどく。ふだは 画面の 中(はれメーターの 下〜案内の 上)に とどめる
    const bounds = {
      minX: 6,
      minY: TOP_H + 44,
      maxX: GAME_W - 6,
      maxY: GAME_H - BOTTOM_PAD + 46,
    };
    const placed = layoutLabels(
      groups.map((g) => g.box),
      bounds,
      LABEL_GAP,
    );

    placed.forEach((box, i) => {
      const g = groups[i];
      g.c.setPosition(box.x, box.y);
      if (!leaderNeeded(box)) return;
      // ふだの ふちから エリアの まんなかへ 細い 線。さきっぽに 小さな まる
      const dx = box.ax - box.x;
      const dy = box.ay - box.y;
      const t = Math.min(
        dx !== 0 ? box.w / 2 / Math.abs(dx) : Infinity,
        dy !== 0 ? box.h / 2 / Math.abs(dy) : Infinity,
      );
      const ex = box.x + dx * t;
      const ey = box.y + dy * t;
      const color = Phaser.Display.Color.HexStringToColor(g.region.color).color;
      leaders.lineStyle(2, 0xffffff, 0.9);
      leaders.lineBetween(ex, ey, box.ax, box.ay);
      leaders.lineStyle(1.2, color, 1);
      leaders.lineBetween(ex, ey, box.ax, box.ay);
      leaders.fillStyle(0xffffff, 1);
      leaders.fillCircle(box.ax, box.ay, 4);
      leaders.fillStyle(color, 1);
      leaders.fillCircle(box.ax, box.ay, 2.6);
    });
  }

  private regionOpen(region: Region): boolean {
    const prefIds = GAME_DATA.prefectures.filter((p) => p.region === region.id).map((p) => p.id);
    return isRegionOpen(store.state, region, prefIds);
  }

  private onRegionTap(region: Region): void {
    if (!region.active) {
      showToast(this, UI_TEXT.region.lockedToast);
      return;
    }
    if (!this.regionOpen(region)) {
      showToast(this, UI_TEXT.region.unlockHint(region.unlockFests ?? 0, playedFestCount(store.state)));
      return;
    }
    SFX.good();
    this.scene.start('MapScene', { regionId: region.id });
  }
}
