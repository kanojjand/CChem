import { describe, expect, it } from 'vitest';
import { ELEMENTS } from './elements';
import { ELEMENT_LABELS, electronConfig, elementCount, elementFacts, romanGroup, shellCounts } from './elementInfo';

describe('element cards', () => {
  it('cover all 118 elements with facts in three languages', () => {
    expect(elementCount()).toBe(118);
    for (const el of ELEMENTS) {
      const f = elementFacts(el.sym);
      expect(f, el.sym).toBeDefined();
      for (const lang of ['kk', 'ru', 'en'] as const) expect(f!.fact[lang].length, `${el.sym} ${lang}`).toBeGreaterThan(20);
    }
  });

  it('compute electron configurations', () => {
    expect(electronConfig(1)).toBe('1s¹');
    expect(electronConfig(10)).toBe('[He] 2s² 2p⁶');
    expect(electronConfig(11)).toBe('[Ne] 3s¹');
    expect(electronConfig(26)).toBe('[Ar] 3d⁶ 4s²');
    expect(electronConfig(24)).toBe('[Ar] 3d⁵ 4s¹');
    expect(electronConfig(29)).toBe('[Ar] 3d¹⁰ 4s¹');
    expect(electronConfig(46)).toBe('[Kr] 4d¹⁰');
    expect(electronConfig(82)).toBe('[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²');
    expect(electronConfig(92)).toBe('[Rn] 5f³ 6d¹ 7s²');
  });

  it('count electrons per shell and name groups', () => {
    expect(shellCounts(11)).toEqual([2, 8, 1]);
    expect(shellCounts(20)).toEqual([2, 8, 8, 2]);
    expect(shellCounts(26)).toEqual([2, 8, 14, 2]);
    expect(romanGroup(ELEMENTS[10])).toBe('IA');
    expect(romanGroup(ELEMENTS[16])).toBe('VIIA');
    expect(romanGroup(ELEMENTS[25])).toBe('VIIIB');
    expect(romanGroup(ELEMENTS[28])).toBe('IB');
  });

  it('know physical states and key numbers', () => {
    expect(elementFacts('Hg')!.st).toBe('l');
    expect(elementFacts('Br')!.st).toBe('l');
    expect(elementFacts('O')!.st).toBe('g');
    expect(elementFacts('Fe')!.mp).toBe(1538);
    expect(elementFacts('C')!.sub).toBeGreaterThan(3000);
    expect(elementFacts('U')!.flags).toContain('radioactive');
    expect(elementFacts('Na')!.flags).toContain('reactive');
    expect(elementFacts('Og')!.mp).toBeUndefined();
  });

  it('have labels in every language', () => {
    for (const lang of ['kk', 'ru', 'en'] as const) expect(Object.keys(ELEMENT_LABELS[lang].flags)).toHaveLength(4);
  });
});
