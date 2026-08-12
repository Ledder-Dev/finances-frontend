import { useMemo, useState } from 'react';

const NEW_TYPE = '__new__';

// resolved `value` is the final type string (existing or freshly typed) —
// callers never see the __new__ sentinel, only ProductTypeSelect does.
export function ProductTypeSelect({ id, products, category, value = '', onChange }) {
  const [isNewMode, setIsNewMode] = useState(false);

  const types = useMemo(() => (
    [...new Set(
      products.filter((p) => !category || p.category === category).map((p) => p.product_type),
    )].filter(Boolean).sort()
  ), [products, category]);

  const handleSelectChange = (selected) => {
    if (selected === NEW_TYPE) {
      setIsNewMode(true);
      onChange('');
    } else {
      setIsNewMode(false);
      onChange(selected);
    }
  };

  return (
    <>
      <select id={id} value={isNewMode ? NEW_TYPE : value} onChange={(e) => handleSelectChange(e.target.value)}>
        <option value="">Select type</option>
        {types.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
        <option value={NEW_TYPE}>— New type —</option>
      </select>
      {isNewMode && (
        <input
          type="text"
          placeholder="New product type"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          style={{ display: 'block', marginTop: 6, width: '100%', padding: '8px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 14 }}
        />
      )}
    </>
  );
}
