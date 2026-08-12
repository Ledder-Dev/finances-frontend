import { useState } from 'react';
import { apiFetch } from '../api.js';
import { ReceiptItemRow } from './ReceiptItemRow.jsx';

export function ReceiptGroup({ receipt, onChanged }) {
  const [editing, setEditing] = useState(false);
  const date = receipt.purchased_at ? receipt.purchased_at.split('T')[0] : receipt.month;
  const [store, setStore] = useState(receipt.store);
  const [editDate, setEditDate] = useState(date);
  const [tax, setTax] = useState(receipt.tax.toFixed(2));

  const save = async () => {
    const trimmedStore = store.trim();
    if (!trimmedStore || !editDate) { alert('Store and date are required.'); return; }
    await apiFetch(`/api/receipts/${receipt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: trimmedStore, purchased_at: editDate, tax: parseFloat(tax) || 0 }),
    });
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm('Delete this receipt and all its items?')) return;
    await apiFetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' });
    onChanged();
  };

  return (
    <div className="receipt-group">
      <div className="receipt-group-header">
        <div>
          <div className="receipt-group-header-left">{receipt.store}</div>
          <div className="receipt-group-header-meta">{date} · {receipt.items.length} item(s)</div>
        </div>
        <div className="receipt-group-header-right">
          <div>
            <div className="receipt-group-total">${receipt.total.toFixed(2)}</div>
            {receipt.tax > 0 && <div className="receipt-group-tax">subtotal ${receipt.subtotal.toFixed(2)} + tax ${receipt.tax.toFixed(2)}</div>}
          </div>
          <button className="btn btn-sm" onClick={() => setEditing((v) => !v)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>
        </div>
      </div>
      {editing && (
        <div className="edit-form visible" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="form-row-3">
            <div className="form-group">
              <label>Store</label>
              <input type="text" list="storeList" value={store} onChange={(e) => setStore(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tax ($)</label>
              <input type="number" value={tax} step="0.01" min="0" onChange={(e) => setTax(e.target.value)} />
            </div>
          </div>
          <div className="edit-actions">
            <button className="btn btn-primary" style={{ width: 'auto', padding: '7px 20px' }} onClick={save}>Save</button>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="receipt-group-items">
        {receipt.items.map((p) => (
          <ReceiptItemRow key={p.id} item={p} receiptStore={receipt.store} fallbackDate={date} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}
