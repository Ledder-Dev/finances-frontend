import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api.js';
import { useProducts } from '../state/AppStateContext.jsx';
import { ProductRow } from './ProductRow.jsx';

export function ProductList({ active }) {
  const [, setAllProducts] = useProducts();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');

  const loadHistory = () => apiFetch('/api/product-history').then((r) => r.json()).then(({ data }) => setHistory(data));
  const loadProducts = () => apiFetch('/api/products').then((r) => r.json()).then(({ data }) => setAllProducts(data));

  useEffect(() => { if (active) loadHistory(); }, [active]);

  const onChanged = () => { loadHistory(); loadProducts(); };

  const catMap = useMemo(() => {
    const productMap = {};
    history.forEach((p) => {
      if (!productMap[p.product_id]) {
        productMap[p.product_id] = { id: p.product_id, name: p.product_name, category: p.category, type: p.product_type, unit: p.unit, purchases: [] };
      }
      productMap[p.product_id].purchases.push(p);
    });
    const q = search.toLowerCase().trim();
    const map = {};
    Object.values(productMap).forEach((prod) => {
      if (q && !prod.name.toLowerCase().includes(q)) return;
      (map[prod.category] ??= {});
      (map[prod.category][prod.type] ??= []).push(prod);
    });
    return map;
  }, [history, search]);

  const categories = Object.keys(catMap).sort();

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-sunken)', color: 'var(--text-primary)' }}
        />
      </div>
      <div>
        {!history.length && <div className="card"><p style={{ color: '#999', fontSize: 14 }}>No purchases recorded yet.</p></div>}
        {categories.map((cat) => (
          <div key={cat}>
            <div className="pt-cat-header">{cat}</div>
            {Object.keys(catMap[cat]).sort().map((type) => {
              const products = [...catMap[cat][type]].sort((a, b) => a.name.localeCompare(b.name));
              return (
                <div key={type} className="pt-group">
                  <div className="pt-group-header">
                    <span className="pt-type">{type}</span>
                    <span className="pt-count">{products.length} product{products.length > 1 ? 's' : ''}</span>
                  </div>
                  {products.map((prod) => (
                    <ProductRow key={prod.id} product={prod} onChanged={onChanged} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
