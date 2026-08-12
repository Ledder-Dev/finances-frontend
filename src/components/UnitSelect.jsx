import { UNITS } from '../state.js';

export function UnitSelect({ id, value = '', onChange }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {UNITS.map(([v, l]) => (
        <option key={v} value={v}>{v} — {l}</option>
      ))}
    </select>
  );
}
