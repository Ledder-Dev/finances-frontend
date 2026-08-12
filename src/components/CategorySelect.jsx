import { DEFAULT_PRODUCT_CATEGORIES } from '../state.js';

export function CategorySelect({ id, value = '', onChange }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select category</option>
      {DEFAULT_PRODUCT_CATEGORIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
