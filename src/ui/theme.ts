/* 画面サイズ・色・フォントの定数(マジックナンバー集約) */

export const GAME_W = 480;
export const GAME_H = 800;

export const FONT = "'Hiragino Maru Gothic ProN','BIZ UDPGothic','Yu Gothic UI','Meiryo',sans-serif";

export const COLORS = {
  sky: 0xcfeffb,
  ground: 0xf2f7e8,
  sea: 0x8fd0e0,
  panel: 0xffffff,
  panelLine: 0xe2dccc,
  headerBg: 0xfff8e7,
  navBg: 0xfffdf5,
  primary: 0x6fbf44,
  primaryDark: 0x5e9c43,
  orange: 0xff9f40,
  orangeDark: 0xe0812a,
  gray: 0xbdb7aa,
  dim: 0x000000,
  lockedPref: 0xcfcbc0,
  inactivePref: 0xe7e3d8,
  correct: 0x6fbf44,
  wrong: 0xe05b5b,
  gold: 0xffd34d,
  bar: 0x6fbf44,
  barBg: 0xe6e0d0,
} as const;

export const TEXT_COLORS = {
  main: '#4a3b2a',
  sub: '#8a7a62',
  white: '#ffffff',
  accent: '#e0812a',
  good: '#3f7d2c',
  bad: '#c04545',
} as const;

/** 重なり順(depth) */
export const DEPTH = {
  content: 0,
  header: 800,
  nav: 850,
  modal: 900,
  toast: 1000,
  overlay: 1100,
} as const;
