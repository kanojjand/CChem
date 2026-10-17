import { Fragment, type ReactNode } from 'react';
import { tokenize } from '../engine/formula';
import type { Term, Side } from '../engine/equation';

/** Chemical formula with subscripts and charges, e.g. Cu^2+ or Ca(OH)2. */
export function Formula({ f }: { f: string }) {
  // Starch is a polymer: its formula is written with n.
  const shown = f === 'H2SO4c' ? 'H2SO4' : f === 'starch' ? '(C6H10O5)' : f;
  return (
    <span className="formula">
      {tokenize(shown).map((tk, i) =>
        tk.t === 'sub' ? <sub key={i}>{tk.s}</sub> : tk.t === 'sup' ? <sup key={i}>{tk.s}</sup> : <Fragment key={i}>{tk.s}</Fragment>
      )}
      {f === 'starch' && <sub>n</sub>}
    </span>
  );
}

/** Text in which formulas are marked as ⟦…⟧. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/⟦([^⟧]+)⟧/);
  return <>{parts.map((p, i) => (i % 2 ? <Formula key={i} f={p} /> : <Fragment key={i}>{p}</Fragment>))}</>;
}

function TermView({ t, concLabel }: { t: Term; concLabel: string }) {
  return (
    <span className="term">
      {t.k > 1 && <span className="coef">{t.k}</span>}
      <Formula f={t.f} />
      {t.conc && <span className="cond-tag">({concLabel})</span>}
      {t.mark && <span className="mark">{t.mark}</span>}
    </span>
  );
}

function join(terms: Term[], concLabel: string): ReactNode[] {
  const out: ReactNode[] = [];
  terms.forEach((t, i) => {
    if (i) out.push(<span key={`p${i}`} className="op"> + </span>);
    out.push(<TermView key={`t${i}`} t={t} concLabel={concLabel} />);
  });
  return out;
}

export function EquationLine({ side, cond, noReaction, noReactionLabel, concLabel, heatLabel, elLabel }: {
  side: Side;
  cond?: string;
  noReaction?: boolean;
  noReactionLabel: string;
  concLabel: string;
  heatLabel: string;
  elLabel?: string;
}) {
  const condText = cond === 't' ? heatLabel : cond === 'MnO2' ? 'MnO₂' : cond === 'H2SO4c' ? `H₂SO₄ (${concLabel})` : cond === 'el' ? '⚡' : '';
  return (
    <span className="eq-text">
      {join(side.lhs, concLabel)}
      <span className="arrow">
        {condText && <span className="arrow-cond" title={cond === 'el' ? elLabel : undefined}>{condText}</span>}
        <span aria-hidden="true">→</span>
      </span>
      {noReaction ? <span className="no-reaction">{noReactionLabel}</span> : join(side.rhs, concLabel)}
    </span>
  );
}
