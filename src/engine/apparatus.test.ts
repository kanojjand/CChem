import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID } from './data';
import { addReagent, phOf, pour } from './actions';
import { bubbleGas, conductivity, electrolysisStep, testGas } from './apparatus';
import { buildEquations } from './equation';
import { indicatorColor } from './color';
import { newVessel } from './vessel';

const add = (v: ReturnType<typeof newVessel>, id: string, amount: Parameters<typeof addReagent>[2]) => addReagent(v, REAGENT_BY_ID[id], amount, 1000);

describe('amounts', () => {
  it('measures solids in grams', () => {
    const v = newVessel('t', 'tube');
    add(v, 'Fe', { g: 1 });
    expect(v.solids.Fe).toBeCloseTo(17.9, 1);
  });

  it('spills what does not fit', () => {
    const v = newVessel('t', 'tube');
    const r = add(v, 'H2O', { ml: 25 });
    expect(r.added).toBeCloseTo(20);
    expect(r.overflow).toBeCloseTo(5);
    expect(add(v, 'H2O', { ml: 1 }).error).toBe('full');
  });

  it('pours only what fits into a smaller vessel', () => {
    const big = newVessel('b', 'beaker');
    const small = newVessel('t', 'tube');
    add(big, 'CuSO4', { ml: 60 });
    const r = pour(big, small, 2000);
    expect(r.partial).toBe(true);
    expect(small.volume).toBeCloseTo(20);
    expect(big.volume).toBeCloseTo(40);
    expect(big.aq['Cu^2+']).toBeCloseTo(20, 5);
  });

  it('table salt crystals dissolve in water', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'H2O', { ml: 50 });
    add(v, 'NaCls', { g: 5.85 });
    expect(v.aq['Na^+']).toBeCloseTo(100, 0);
    expect(v.solids.NaCl ?? 0).toBeLessThan(1e-6);
  });
});

describe('delivery tube', () => {
  it('CO2 clouds limewater, excess clears it', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'CaOH2', { ml: 50 });
    const first = bubbleGas(v, 'CO2', 0.5, 1000);
    expect(first.events.map((e) => e.kind)).toContain('co2Limewater');
    expect(v.solids.CaCO3).toBeGreaterThan(0.4);
    const more = bubbleGas(v, 'CO2', 2, 2000);
    expect(more.events.map((e) => e.kind)).toContain('limewaterClears');
    expect(v.solids.CaCO3 ?? 0).toBeLessThan(1e-6);
  });

  it('ammonia makes water with phenolphthalein crimson', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'H2O', { ml: 20 });
    add(v, 'phph', { drops: 2 });
    bubbleGas(v, 'NH3', 2, 1000);
    expect(indicatorColor('phph', phOf(v)!).name).toBe('crimson');
  });

  it('hydrogen bubbles through water', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'H2O', { ml: 20 });
    expect(bubbleGas(v, 'H2', 1, 1000).events.map((e) => e.kind)).toContain('gasThrough');
  });
});

describe('gas tests', () => {
  it('identifies the school gases', () => {
    expect(testGas({ O2: 2 }, 'glowing').result).toBe('relights');
    expect(testGas({ H2: 2 }, 'burning').result).toBe('pop');
    expect(testGas({ H2: 2, O2: 1 }, 'burning').result).toBe('loudPop');
    expect(testGas({ CO2: 2 }, 'burning').result).toBe('goesOut');
    expect(testGas({ CO2: 2 }, 'limewater').result).toBe('limewaterCloudy');
    expect(testGas({ NH3: 1 }, 'litmus').result).toBe('litmusBlue');
    expect(testGas({}, 'burning').result).toBe('burnsAsUsual');
  });
});

describe('conductivity and electrolysis', () => {
  it('tells electrolytes from non-electrolytes', () => {
    const water = newVessel('a', 'beaker'); add(water, 'H2O', { ml: 50 });
    const sugar = newVessel('b', 'beaker'); add(sugar, 'H2O', { ml: 50 }); add(sugar, 'sugar', { g: 5 });
    const vinegar = newVessel('c', 'beaker'); add(vinegar, 'CH3COOH', { ml: 50 });
    const salt = newVessel('d', 'beaker'); add(salt, 'NaCl', { ml: 50 });
    expect(conductivity(water)).toBe('none');
    expect(conductivity(sugar)).toBe('none');
    expect(conductivity(vinegar)).toBe('weak');
    expect(conductivity(salt)).toBe('strong');
  });

  it('CuCl2 gives copper and chlorine', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'CuCl2', { ml: 20 });
    v.electro = { cathode: {} };
    const events = electrolysisStep(v, 60, 1000);
    expect(events[0].kind).toBe('electrolysis');
    expect(events[0].p).toMatchObject({ cathode: 'Cu', anode: 'Cl2' });
    expect(v.electro.cathode.Cu).toBeGreaterThan(0.2);
    expect(v.gasTotal.Cl2).toBeGreaterThan(0.2);
    const eq = buildEquations(events[0].eq!)!;
    expect(eq.molecular.lhs.map((t) => t.f)).toEqual(['CuCl2']);
    expect(eq.molecular.rhs.map((t) => `${t.k}${t.f}`)).toEqual(['1Cu', '1Cl2']);
  });

  it('NaCl solution gives hydrogen, chlorine and alkali', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'NaCl', { ml: 20 });
    v.electro = { cathode: {} };
    const [e] = electrolysisStep(v, 120, 1000);
    expect(e.p).toMatchObject({ cathode: 'H2', anode: 'Cl2' });
    expect(phOf(v)!).toBeGreaterThan(11);
    const eq = buildEquations(e.eq!)!;
    expect(eq.molecular.rhs.map((t) => t.f)).toContain('NaOH');
  });

  it('sodium sulfate solution splits water', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'Na2SO4', { ml: 20 });
    v.electro = { cathode: {} };
    const [e] = electrolysisStep(v, 60, 1000);
    expect(e.p).toMatchObject({ cathode: 'H2', anode: 'O2' });
    expect(v.gasTotal.H2 / v.gasTotal.O2).toBeCloseTo(2, 5);
  });

  it('distilled water does not conduct', () => {
    const v = newVessel('b', 'beaker');
    add(v, 'H2O', { ml: 20 });
    v.electro = { cathode: {} };
    expect(electrolysisStep(v, 60, 1000)[0].kind).toBe('noCurrent');
  });
});
