import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api.js';

// Oz/Lb share a mass base (Lb); Lt and U have no convertible counterpart.
const UNIT_TO_BASE = { Oz: { base: 'Lb', factor: 1 / 16 }, Lb: { base: 'Lb', factor: 1 }, Lt: { base: 'Lt', factor: 1 }, U: { base: 'U', factor: 1 } };

export function CompareTab({ active }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (active) apiFetch('/api/product-history').then((r) => r.json()).then(({ data }) => setHistory(data));
  }, [active]);

  const groups = useMemo(() => {
    const byProduct = {};
    history.forEach((p) => {
      const price = parseFloat(p.unit_price);
      const { base, factor } = UNIT_TO_BASE[p.unit] || { base: p.unit, factor: 1 };
      const normalizedPrice = price / factor;
      const entry = byProduct[p.product_id] ??= { name: p.product_name, type: p.product_type, base, best: null };
      if (!entry.best || normalizedPrice < entry.best.normalizedPrice) entry.best = { normalizedPrice, store: p.store };
    });
    const byType = {};
    Object.values(byProduct).forEach((prod) => (byType[prod.type] ??= []).push(prod));
    Object.values(byType).forEach((list) => list.sort((a, b) => a.best.normalizedPrice - b.best.normalizedPrice));
    return byType;
  }, [history]);

  const allTypes = Object.keys(groups).sort();
  const types = allTypes.filter((t) => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <input
        type="text"
        list="compare-type-list"
        placeholder="Search by type..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '6px 10px', border: '1px solid var(--border-medium)', borderRadius: 6, fontSize: 13, width: '100%', marginBottom: 12, boxSizing: 'border-box' }}
      />
      <datalist id="compare-type-list">
        {allTypes.map((t) => <option key={t} value={t} />)}
      </datalist>
      {!types.length && <div className="card"><p style={{ color: 'var(--text-faint)', fontSize: 14 }}>No matching products.</p></div>}
      {types.map((type) => (
        <div key={type} className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>{type}</h3>
          {groups[type].map((prod, i) => (
            <div
              key={prod.name}
              style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: i < groups[type].length - 1 ? '1px solid var(--border-faint)' : 'none',
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              <span>{prod.name}{i === 0 ? ' 🏆' : ''}</span>
              <span style={{ color: 'var(--text-muted)' }}>${prod.best.normalizedPrice.toFixed(4)}/{prod.base}{prod.best.store ? ` · ${prod.best.store}` : ''}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
