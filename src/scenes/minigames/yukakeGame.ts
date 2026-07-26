/* べっぷ おんせんまつり(おおいた): 「ゆかけ」の ぎょうじ。ひしゃくで おんせんの ゆを かけあって
   まちの みんなを あたためる。ただし あつすぎる ゆは にがてな ひとも いる ―
   だから これは「ゆの りょうを ちょうせいする」ながおしゲーム。
     ・ゆぶねを ながおしして ひしゃくに ゆを ためる(ゲージ)
     ・ながしすぎると あつあつ、すこしだと ぬるい
     ・おきゃくさんの ふきだしに 「♨️(あつめ)」「💧(ぬるめ)」の ぬみが でるので、それに あわせて はなす
   ちょうどの ときは 大よろこび。ちがっても おこらない(コンボが きれるだけ)。
   動作=ながおしの りょう調整。タップの タイミングとは べつの てざわり */
import Phaser from 'phaser';
import { addIcon, iconScale, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = 660;
const CX = GAME_W / 2;
/** おきゃくの すがた(おとな・こども・おじいさん が じゅんばんに くる) */
const GUESTS = ['person:teal', 'person:pink', 'person-child:amber', 'person:gray'] as const;
/** ゲージ(ためた ゆの りょう 0〜1) */
const FILL_PER_SEC = 0.55;
const HOT_LINE = 0.66;
const WARM_LINE = 0.34;
const OK_PTS = 16;
const PERFECT_PTS = 28;
const GUEST_Y = 300;

type Want = 'hot' | 'warm';

export function renderYukake(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xd8eef5, 0xd8eef5, 0xf5e0d0, 0xf5e0d0, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  // ゆけむり
  for (let i = 0; i < 5; i++) {
    bg.fillStyle(0xffffff, 0.35);
    bg.fillEllipse(50 + i * 96, 120 + (i % 2) * 30, 90, 34);
  }
  bg.fillStyle(0xb0d8e8, 1);
  bg.fillRoundedRect(60, 470, GAME_W - 120, 120, 20); // ゆぶね
  bg.fillStyle(0x8ec4d8, 1);
  bg.fillRoundedRect(72, 482, GAME_W - 144, 96, 16);
  area.add(bg);
  area.add(addIcon(scene, CX, 452, 'hotspring:sky', 30));

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'yukake',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- おきゃくさん ---------- */
  const guest = addIcon(scene, CX, GUEST_Y, 'person:teal', 46);
  area.add(guest);
  const bubble = scene.add
    .text(CX, GUEST_Y - 78, '', {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#5a4632',
      backgroundColor: '#ffffff',
      padding: { x: 14, y: 8 },
    })
    .setOrigin(0.5);
  area.add(bubble);

  let want: Want = 'hot';
  let served = 0;
  const nextGuest = (): void => {
    if (session.isEnded()) return;
    want = Math.random() < 0.5 ? 'hot' : 'warm';
    setIcon(guest, GUESTS[Math.floor(Math.random() * GUESTS.length)]);
    guest.setX(90 + Math.random() * (GAME_W - 180));
    bubble.setX(guest.x);
    bubble.setText(want === 'hot' ? UI_TEXT.fest.yukakeWantHot : UI_TEXT.fest.yukakeWantWarm);
    // おきゃくは アイコン、ふきだしは 文字なので それぞれの もとの 大きさで ぷるんと させる
    scene.tweens.add({ targets: guest, scale: { from: iconScale(guest, 0.85), to: iconScale(guest) }, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: bubble, scale: { from: 0.85, to: 1 }, duration: 220, ease: 'Back.easeOut' });
    SFX.hint();
  };
  nextGuest();

  /* ---------- ひしゃく(ながおしで ゆを ためる) ---------- */
  let fill = 0;
  let filling = false;
  const hishaku = addIcon(scene, CX, 420, 'ladle:tan', 34);
  area.add(hishaku);
  const gauge = scene.add.graphics();
  area.add(gauge);
  const draw = (): void => {
    gauge.clear();
    gauge.fillStyle(0xffffff, 0.75);
    gauge.fillRoundedRect(90, 620, GAME_W - 180, 22, 11);
    // ゾーンの めやす
    gauge.fillStyle(0x9ad0f5, 0.7);
    gauge.fillRoundedRect(90, 620, (GAME_W - 180) * WARM_LINE, 22, 11);
    gauge.fillStyle(0xffb08a, 0.8);
    gauge.fillRoundedRect(90 + (GAME_W - 180) * HOT_LINE, 620, (GAME_W - 180) * (1 - HOT_LINE), 22, 11);
    gauge.fillStyle(0xe05b5b, 1);
    gauge.fillRoundedRect(90 + (GAME_W - 180) * fill - 4, 612, 8, 38, 4);
    hishaku.setScale(iconScale(hishaku, 1 + fill * 0.45));
  };
  draw();
  area.add(
    scene.add
      .text(CX, 590, UI_TEXT.fest.yukakeGuide, { fontFamily: FONT, fontSize: '13px', color: '#5a4632' })
      .setOrigin(0.5),
  );

  const pour = (): void => {
    const hot = fill >= HOT_LINE;
    const warm = fill <= WARM_LINE;
    const okHot = want === 'hot' && hot;
    const okWarm = want === 'warm' && warm;
    // ゆを かける えんしゅつ
    const splash = addIcon(scene, hishaku.x, hishaku.y - 20, 'splash:sky', 26);
    area.add(splash);
    scene.tweens.add({
      targets: splash,
      x: guest.x,
      y: guest.y,
      duration: 260,
      onComplete: () => splash.destroy(),
    });
    scene.time.delayedCall(260, () => {
      if (okHot || okWarm) {
        // ちょうどの ゾーンの まんなかに ちかいほど 大せいこう
        const center = want === 'hot' ? (HOT_LINE + 1) / 2 : WARM_LINE / 2;
        const perfect = Math.abs(fill - center) < 0.12;
        served++;
        if (perfect) {
          SFX.fanfare();
          bigImpact(scene, guest.x, guest.y + api.areaY, 0xffd34d);
          confetti(scene, 12);
          session.addPoints(PERFECT_PTS, guest.x, guest.y + api.areaY - 60);
          floatUp(scene, guest.x, guest.y + api.areaY - 100, UI_TEXT.fest.yukakePerfect, '#e0812a');
        } else {
          SFX.good();
          impactRing(scene, guest.x, guest.y + api.areaY, 0x9ccb6f, 12);
          session.addPoints(OK_PTS, guest.x, guest.y + api.areaY - 60);
          floatUp(scene, guest.x, guest.y + api.areaY - 100, UI_TEXT.fest.yukakeOk, '#3f7d2c');
        }
        burst(scene, guest.x, guest.y + api.areaY, perfect ? 12 : 5, [0x9ad0f5, 0xffffff]);
        setIcon(guest, 'face-smile:cream');
      } else {
        SFX.bad();
        missShake(scene);
        session.resetCombo();
        floatUp(
          scene,
          guest.x,
          guest.y + api.areaY - 60,
          want === 'hot' ? UI_TEXT.fest.yukakeTooCool : UI_TEXT.fest.yukakeTooHot,
          '#c04545',
        );
      }
      fill = 0;
      draw();
      scene.time.delayedCall(500, nextGuest);
    });
  };

  const onDown = (): void => {
    if (session.isEnded()) return;
    filling = true;
    fill = 0;
    SFX.pop();
  };
  const onUp = (): void => {
    if (!filling || session.isEnded()) return;
    filling = false;
    pour();
  };
  scene.input.on('pointerdown', onDown);
  onPointerRelease(scene, onUp);

  const info = scene.add
    .text(CX, 240, '', { fontFamily: FONT, fontSize: '14px', color: '#5a4632' })
    .setOrigin(0.5);
  area.add(info);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    if (filling) fill = Math.min(1, fill + FILL_PER_SEC * (Math.min(dtMs, 33) / 1000));
    info.setText(UI_TEXT.fest.yukakeInfo(served));
    draw();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}
