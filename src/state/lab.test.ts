import { describe, expect, it } from 'vitest';
import { COLLECTOR_ID, Lab } from './lab';

describe('lab apparatus', () => {
  it('collects hydrogen through a delivery tube and tests it with a burning splint', () => {
    const lab = new Lab();
    lab.add('HCl', { ml: 5 }, 't1');
    lab.setTube('t1', COLLECTOR_ID);
    lab.add('Zn', { g: 0.3 }, 't1');
    expect(lab.collectorMl()).toBeGreaterThan(50);
    expect(lab.collector.gases.H2).toBeGreaterThan(0);
    expect(lab.testGas(COLLECTOR_ID, 'burning').result).toBe('pop');
    expect(lab.collector.gases.H2 ?? 0).toBe(0);
  });

  it('passes CO2 from marble and acid into limewater', () => {
    const lab = new Lab();
    lab.add('CaOH2', { ml: 50 }, 'b1');
    lab.add('HCl', { ml: 5 }, 't2');
    lab.setTube('t2', 'b1');
    lab.add('CaCO3', { g: 0.1 }, 't2');
    expect(lab.vessel('b1').solids.CaCO3).toBeGreaterThan(0);
    expect(lab.discoveries).toContain('co2:limewater');
  });

  it('titration of the unknown acid finds its concentration', () => {
    const lab = new Lab();
    lab.add('HClx', { ml: 20 }, 'f1');
    lab.add('phph', { drops: 2 }, 'f1');
    lab.attachBurette('f1', 'NaOH01');
    let guard = 0;
    while (!lab.burette!.endpoint && guard++ < 2000) lab.titrate(0.05, false);
    const ep = lab.burette!.endpoint!;
    expect(ep).toBeDefined();
    const c = (0.1 * ep.v) / 20;
    expect(Math.abs(c - lab.unknownC) / lab.unknownC).toBeLessThan(0.05);
  });

  it('runs electrolysis faster when time is sped up', () => {
    const slow = new Lab();
    const fast = new Lab();
    for (const lab of [slow, fast]) { lab.add('CuSO4', { ml: 20 }, 'b1'); lab.toggleElectro('b1'); }
    fast.setSpeed(20);
    slow.step(1); fast.step(1);
    expect(fast.vessel('b1').electro!.cathode.Cu).toBeCloseTo(slow.vessel('b1').electro!.cathode.Cu * 20, 5);
  });

  it('distils water: steam from a boiling vessel condenses in another one', () => {
    const lab = new Lab();
    lab.add('KMnO4', { ml: 5 }, 't1');
    lab.setTube('t1', 't2');
    lab.toggleHeat('t1');
    lab.setSpeed(60);
    for (let i = 0; i < 40; i++) lab.step(0.25);
    const t2 = lab.vessel('t2');
    expect(t2.volume).toBeGreaterThan(0.2);
    expect(t2.aq['MnO4^-'] ?? 0).toBe(0);
    expect(lab.discoveries).toContain('distillation');
  });

  it('heating potassium permanganate fills the collector with oxygen that relights a splint', () => {
    const lab = new Lab();
    lab.add('KMnO4s', { g: 1 }, 't1');
    lab.setTube('t1', 'collector');
    lab.toggleHeat('t1');
    lab.setSpeed(20);
    for (let i = 0; i < 60; i++) lab.step(0.25);
    expect(lab.collector.gases.O2).toBeGreaterThan(0);
    expect(lab.testGas('collector', 'glowing').result).toBe('relights');
  });

  it('magnet pulls iron out of a mixture with sulfur but not out of iron sulfide', () => {
    const lab = new Lab();
    lab.add('Fe', { g: 0.5 }, 't1');
    lab.add('S', { g: 0.3 }, 't1');
    expect(lab.magnet('t1').grams).toBeGreaterThan(0.4);
    lab.add('Fe', { g: 0.5 }, 't2');
    lab.add('S', { g: 0.3 }, 't2');
    lab.toggleHeat('t2');
    lab.setSpeed(20);
    for (let i = 0; i < 60; i++) lab.step(0.25);
    expect(lab.vessel('t2').solids.FeS).toBeGreaterThan(0);
    expect(lab.magnet('t2').grams).toBe(0);
  });
});
