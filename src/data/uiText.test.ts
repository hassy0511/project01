import { describe, expect, it } from 'vitest';
import { TITLE_TEXT } from './uiText';

describe('uiText', () => {
  it('タイトル文言が定義されている', () => {
    expect(TITLE_TEXT.length).toBeGreaterThan(0);
  });
});
