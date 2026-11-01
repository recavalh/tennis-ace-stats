import { describe, expect, it } from 'vitest';
import { hasUnknownShot, isBuildMismatch } from '../apps/client/src/compatibility';
import { TacticalEngine } from '../packages/game-engine/src';
describe('Compatibilidade entre aba e servidor', () => {
  it('detecta builds diferentes sem bloquear desenvolvimento ou servidores anteriores', () => {
    expect(isBuildMismatch('old', 'new')).toBe(true);
    expect(isBuildMismatch('new', 'new')).toBe(false);
    expect(isBuildMismatch('development', 'new')).toBe(false);
    expect(isBuildMismatch('new', undefined)).toBe(false);
  });
  it('reconhece os voleios atuais e detecta opções de um catálogo futuro', () => {
    const e = new TacticalEngine('computer', ['A','B'], ['#ddeb78','#f0a878']);
    e.state.options = ['volley-deep','volley-angle','volley-block'];
    expect(hasUnknownShot(e.state)).toBe(false);
    e.state.options = ['future-volley' as any];
    expect(hasUnknownShot(e.state)).toBe(true);
    expect(hasUnknownShot(null)).toBe(false);
  });
});
