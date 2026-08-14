import { useState } from 'react';
import { apiFetch } from '../api.js';
import { CategorySelect } from '../components/CategorySelect.jsx';

export function ReceiptItemRow({ item, receiptStore, fallbackDate, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description || '');
  const [qty, setQty] = useState(String(parseFloat(item.quantity)));
  const [amount, setAmount] = useState(String(parseFloat(item.total_amount)));

  const itemDate = item.purchased_at ? item.purchased_at.split('T')[0] : fallbackDate;
  const store = item.store || receiptStore;

  const unitPriceDisplay = parseFloat(qty) > 0 && parseFloat(amount) > 0
    ? `$${(parseFloat(amount) / parseFloat(qty)).toFixed(4)}`
    : '—';

  const save = async () => {
    const q = parseFloat(qty);
    const amt = parseFloat(amount);
    if (!q || !amt) { alert('Quantity and amount are required.'); return; }
    await apiFetch(`/api/purchases/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, description: description.trim(), store, quantity: q, total_amount: amt, purchased_at: itemDate }),
    });
    setEditing(false);
    onChanged();
  };

  return (
    <>
      <div className="list-item">
        <div className="list-item-info">
          <div className="list-item-name">{item.product_name}<span className="badge">{item.category}</span><span className="badge">{item.product_type}</span></div>
          <div className="list-item-meta">{parseFloat(item.quantity)} {item.unit}{item.description ? ` · ${item.description}` : ''}</div>
        </div>
        <div className="list-item-right">
          <div className="list-item-amount expense">${parseFloat(item.total_amount).toFixed(2)}</div>
          <div className="list-item-unit-price">${parseFloat(item.unit_price).toFixed(4)} / {item.unit}</div>
        </div>
        <button className="btn btn-sm" onClick={() => setEditing((v) => !v)}>Edit</button>
      </div>
      {editing && (
        <div className="edit-form visible">
          <div className="form-row">
            <div className="form-group"><label>Category</label><CategorySelect value={category} onChange={setCategory} /></div>
            <div className="form-group"><label>Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
          <div className="form-row-3">
            <div className="form-group"><label>Quantity</label><input type="number" step="0.001" min="0.001" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
            <div className="form-group"><label>Total amount ($)</label><input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="form-group"><label>Unit price (auto)</label><div className="unit-price-display">{unitPriceDisplay}</div></div>
          </div>
          <div className="edit-actions">
            <button className="btn btn-primary" style={{ width: 'auto', padding: '7px 20px' }} onClick={save}>Save</button>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
