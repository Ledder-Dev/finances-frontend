import { useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth, useProducts } from '../state/AppStateContext.jsx';
import { findProduct } from '../lib/findProduct.js';
import { ReceiptLine } from './ReceiptLine.jsx';

let lineSeq = 0;
const newLine = () => ({ id: lineSeq++, productSearch: '', description: '', count: '1', qty: '', amount: '', category: '', type: '', unit: 'U' });

export function ReceiptForm({ scanInputRef, setScanning, onSaved }) {
  const [currentMonth] = useCurrentMonth();
  const [allProducts, setAllProducts] = useProducts();
  const [store, setStore] = useState('');
  const [date, setDate] = useState('');
  const [tax, setTax] = useState('0');
  const [lines, setLines] = useState([]);

  const patchLine = (id, patch) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (id) => setLines((prev) => prev.filter((l) => l.id !== id));

  const onProductSearchChange = (id, value) => {
    const match = findProduct(allProducts, value);
    const line = lines.find((l) => l.id === id);
    const patch = { productSearch: value };
    if (match?.last_unit_price) {
      const lastUnitPrice = parseFloat(match.last_unit_price);
      const qty = match.last_quantity ? parseFloat(match.last_quantity) : parseFloat(line.qty);
      const count = parseInt(line.count) || 1;
      if (match.last_quantity) patch.qty = String(qty);
      if (qty > 0) patch.amount = (qty * lastUnitPrice * count).toFixed(2);
    }
    patchLine(id, patch);
  };

  const onCountChange = (id, value) => {
    const line = lines.find((l) => l.id === id);
    const newCount = parseInt(value) || 1;
    const prevCount = parseInt(line.count) || 1;
    const qty = parseFloat(line.qty);
    const prevAmt = parseFloat(line.amount);
    const patch = { count: value };
    if (qty > 0 && prevAmt > 0) {
      const unitPrice = prevAmt / prevCount / qty;
      patch.amount = (unitPrice * qty * newCount).toFixed(2);
    }
    patchLine(id, patch);
  };

  const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const taxNum = parseFloat(tax) || 0;

  const resetForm = () => { setStore(''); setTax('0'); setLines([]); };

  const submit = async () => {
    const trimmedStore = store.trim();
    if (!trimmedStore || !date) { alert('Store and date are required.'); return; }
    if (!lines.length) { alert('Add at least one item.'); return; }

    const items = [];
    for (const line of lines) {
      const productSearch = line.productSearch.trim();
      const qty = parseFloat(line.qty);
      const amt = parseFloat(line.amount);
      if (!productSearch || !qty || !amt) { alert(`Fill in all fields for item "${productSearch || line.id}".`); return; }

      const match = findProduct(allProducts, productSearch);
      let productId = match?.id;
      if (!productId) {
        if (!line.type) { alert(`Select or enter a product type for "${productSearch}".`); return; }
        const res = await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: productSearch, category: line.category.trim() || 'Miscellaneous', product_type: line.type.trim(), unit: line.unit }),
        });
        const json = await res.json();
        if (!json.success) { alert(`Could not create product "${productSearch}": ${json.error}`); return; }
        productId = json.data.id;
      }

      const count = parseInt(line.count) || 1;
      const perItemAmt = amt / count;
      for (let i = 0; i < count; i++) {
        items.push({ product_id: productId, description: line.description.trim(), quantity: qty, total_amount: perItemAmt });
      }
    }

    await apiFetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: trimmedStore, purchased_at: date, month: currentMonth, tax: taxNum, items }),
    });

    resetForm();
    const { data } = await apiFetch('/api/products').then((r) => r.json());
    setAllProducts(data);
    onSaved();
  };

  const handleScanFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setScanning(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiFetch('/api/scan-receipt', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Scan failed');
      const { data } = await res.json();
      if (data.store) setStore(data.store);
      if (data.date) setDate(data.date);
      setTax((data.tax || 0).toFixed(2));
      setLines((data.items || []).map((item) => ({
        ...newLine(),
        productSearch: item.name || '',
        qty: String(item.quantity || 1),
        amount: (item.total || 0).toFixed(2),
      })));
    } catch {
      alert('Could not scan receipt. Check your OpenAI API key and try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="card">
      <h2>Add receipt</h2>
      <input type="file" ref={scanInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScanFile} />
      <div className="form-row-3">
        <div className="form-group">
          <label>Store</label>
          <input type="text" list="storeList" placeholder="e.g. Walmart" value={store} onChange={(e) => setStore(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Tax ($)</label>
          <input
            type="number"
            value={tax}
            step="0.01"
            min="0"
            onChange={(e) => setTax(e.target.value)}
            onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = ''; }}
            onBlur={(e) => { if (e.target.value === '') setTax('0'); }}
          />
        </div>
      </div>

      <div>
        {lines.map((line) => (
          <ReceiptLine
            key={line.id}
            line={line}
            allProducts={allProducts}
            match={findProduct(allProducts, line.productSearch)}
            onPatch={(patch) => patchLine(line.id, patch)}
            onProductSearchChange={(v) => onProductSearchChange(line.id, v)}
            onCountChange={(v) => onCountChange(line.id, v)}
            onRemove={() => removeLine(line.id)}
          />
        ))}
      </div>
      <button className="btn btn-sm" style={{ marginBottom: 12 }} onClick={addLine}>+ Add item</button>

      <div className="receipt-totals-bar">
        <span>Subtotal: <strong>${subtotal.toFixed(2)}</strong></span>
        <span>Tax: <strong>${taxNum.toFixed(2)}</strong></span>
        <span>Total: <strong>${(subtotal + taxNum).toFixed(2)}</strong></span>
      </div>

      <button className="btn btn-primary" onClick={submit}>Save receipt</button>
    </div>
  );
}
