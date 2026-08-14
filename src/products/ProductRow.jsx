import { useMemo, useState } from 'react';
import { apiFetch } from '../api.js';
import { CategorySelect } from '../components/CategorySelect.jsx';
import { UnitSelect } from '../components/UnitSelect.jsx';
import { PurchaseHistoryRow } from './PurchaseHistoryRow.jsx';

export function ProductRow({ product, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [type, setType] = useState(product.type);
  const [unit, setUnit] = useState(product.unit);

  const bestPrice = useMemo(() => Math.min(...product.purchases.map((p) => parseFloat(p.unit_price))), [product.purchases]);
  const last = product.purchases[0];
  const lastDate = last.purchased_at ? last.purchased_at.split('T')[0] : last.month;

  const saveProduct = async () => {
    if (!name.trim() || !category || !type.trim() || !unit) { alert('All fields are required.'); return; }
    const res = await apiFetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), category, product_type: type.trim(), unit }),
    });
    if (!(await res.json()).success) { alert('Failed to save product.'); return; }
    setEditing(false);
    onChanged();
  };

  const deleteProduct = async () => {
    const count = product.purchases.length;
    const warning = count > 0
      ? `"${product.name}" has ${count} purchase record${count !== 1 ? 's' : ''}.\n\nIt will be hidden from the product list and autocomplete, but its purchase history will be kept — past spending totals won't change.`
      : `Delete "${product.name}"?`;
    if (!confirm(warning)) return;
    await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <>
      <div className="pt-product-row" onClick={() => setExpanded((v) => !v)}>
        <div className="pt-row-info">
          <span className="pt-name">{product.name}</span>
          <span className="pt-meta">Last: {lastDate}{last.store ? ` · ${last.store}` : ''}</span>
        </div>
        <div className="pt-row-right">
          <span className="pt-unit-price best-price">${bestPrice.toFixed(4)}/{product.unit}</span>
          <span className="pt-purchases-count">{product.purchases.length}×</span>
        </div>
        <div className="pt-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-sm" onClick={() => setEditing((v) => !v)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={deleteProduct}>Delete</button>
        </div>
        <span className="pt-chevron">{expanded ? '▲' : '▼'}</span>
      </div>
      {editing && (
        <div className="pt-product-edit">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <CategorySelect value={category} onChange={setCategory} />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Type</label>
              <input type="text" value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <UnitSelect value={unit} onChange={setUnit} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={saveProduct}>Save</button>
            <button className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
      {expanded && (
        <div className="pt-history">
          {product.purchases.map((p) => {
            const isBest = Math.abs(parseFloat(p.unit_price) - bestPrice) < 0.00001;
            return <PurchaseHistoryRow key={p.id} purchase={p} unit={product.unit} isBest={isBest} onChanged={onChanged} />;
          })}
        </div>
      )}
    </>
  );
}
