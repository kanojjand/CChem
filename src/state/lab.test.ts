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
});
