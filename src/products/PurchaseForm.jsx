import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth, useProducts } from '../state/AppStateContext.jsx';
import { CategorySelect } from '../components/CategorySelect.jsx';
import { UnitSelect } from '../components/UnitSelect.jsx';
import { ProductTypeSelect } from '../components/ProductTypeSelect.jsx';
import { findProduct } from '../lib/findProduct.js';

export function PurchaseForm() {
  const [currentMonth] = useCurrentMonth();
  const [allProducts, setAllProducts] = useProducts();
  const [stores, setStores] = useState([]);

  const [productSearch, setProductSearch] = useState('');
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState('');
  const [newUnit, setNewUnit] = useState('U');
  const [description, setDescription] = useState('');
  const [store, setStore] = useState('');
  const [qty, setQty] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const loadProducts = () => apiFetch('/api/products').then((r) => r.json()).then(({ data }) => setAllProducts(data));
  const loadStores = () => apiFetch('/api/stores').then((r) => r.json()).then(({ data }) => setStores(data));

  useEffect(() => { loadProducts(); loadStores(); }, []);

  const match = useMemo(() => findProduct(allProducts, productSearch), [allProducts, productSearch]);

  useEffect(() => {
    if (!match) return;
    setIsNewProduct(false);
    const lastPrice = match.last_unit_price ? parseFloat(match.last_unit_price) : 0;
    const parsedQty = parseFloat(qty);
    if (lastPrice && parsedQty > 0) setAmount((parsedQty * lastPrice).toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  const unitPriceDisplay = parseFloat(qty) > 0 && parseFloat(amount) > 0
    ? `$${(parseFloat(amount) / parseFloat(qty)).toFixed(4)}`
    : '—';

  const priceHint = match?.last_unit_price
    ? `Last price: $${parseFloat(match.last_unit_price).toFixed(4)} / ${match.unit}`
    : '';

  const resetForm = () => {
    setProductSearch(''); setDescription(''); setStore(''); setQty(''); setAmount('');
    setIsNewProduct(false); setNewCategory(''); setNewType(''); setNewUnit('U');
  };

  const submit = async () => {
    const trimmedSearch = productSearch.trim();
    if (!trimmedSearch || !qty || !amount || !date) { alert('Fill in all purchase fields.'); return; }

    let productId = match?.id;
    if (!productId) {
      if (!isNewProduct) { alert('Select an existing product or click "+ Add as new product".'); return; }
      if (!newType) { alert('Select or enter a product type.'); return; }
      const res = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedSearch, category: newCategory.trim() || 'Miscellaneous', product_type: newType, unit: newUnit }),
      });
      const json = await res.json();
      if (!json.success) { alert(`Could not create product "${trimmedSearch}": ${json.error}`); return; }
      productId = json.data.id;
    }

    await apiFetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        description: description.trim(),
        store: store.trim(),
        quantity: parseFloat(qty),
        total_amount: parseFloat(amount),
        month: currentMonth,
        purchased_at: date,
      }),
    });

    resetForm();
    await loadProducts();
    await loadStores();
  };

  return (
    <div className="card">
      <h2>Add purchase</h2>
      <div className="form-group">
        <label>Product</label>
        <input
          type="text"
          list="productList"
          placeholder="Search or type a new product name"
          autoComplete="off"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
        />
        <datalist id="productList">
          {allProducts.map((p) => <option key={p.id} value={p.name} />)}
        </datalist>
        {priceHint && <small style={{ display: 'block', fontSize: 12, color: '#0c447c', marginTop: 4 }}>{priceHint}</small>}
      </div>
      {!match && (
        <button type="button" className="new-product-toggle" onClick={() => setIsNewProduct((v) => !v)}>
          {isNewProduct ? '− Cancel new product' : '+ Add as new product'}
        </button>
      )}
      {isNewProduct && (
        <div className="new-product-fields visible">
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <CategorySelect value={newCategory} onChange={setNewCategory} />
            </div>
            <div className="form-group">
              <label>Product type</label>
              <ProductTypeSelect products={allProducts} category={newCategory} value={newType} onChange={setNewType} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Unit</label>
              <UnitSelect value={newUnit} onChange={setNewUnit} />
            </div>
          </div>
        </div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label>Description</label>
          <input type="text" placeholder="e.g. 2% fat, organic" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Store</label>
          <input type="text" list="storeList" placeholder="e.g. Walmart" value={store} onChange={(e) => setStore(e.target.value)} />
          <datalist id="storeList">
            {stores.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label>Quantity</label>
          <input type="number" placeholder="0" step="0.001" min="0.001" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Total amount ($)</label>
          <input type="number" placeholder="0.00" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Unit price (auto)</label>
          <div className="unit-price-display">{unitPriceDisplay}</div>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={submit}>Add purchase</button>
    </div>
  );
}
