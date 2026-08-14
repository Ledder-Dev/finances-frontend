import { CategorySelect } from '../components/CategorySelect.jsx';
import { ProductTypeSelect } from '../components/ProductTypeSelect.jsx';
import { UnitSelect } from '../components/UnitSelect.jsx';

export function ReceiptLine({ line, allProducts, match, onPatch, onProductSearchChange, onCountChange, onRemove }) {
  const count = parseInt(line.count) || 1;
  const qty = parseFloat(line.qty);
  const amt = parseFloat(line.amount);
  let unitPriceDisplay = '—';
  if (qty > 0 && amt > 0) {
    const perItem = amt / count;
    const unitPrice = perItem / qty;
    unitPriceDisplay = count > 1 ? `$${unitPrice.toFixed(4)} (×${count}: $${perItem.toFixed(2)}/item)` : `$${unitPrice.toFixed(4)}`;
  }

  const hint = match?.last_unit_price ? `Last: $${parseFloat(match.last_unit_price).toFixed(4)} / ${match.unit}` : '';
  const showNewFields = !match && line.productSearch.length > 0;

  return (
    <div className="receipt-line">
      <div className="receipt-line-header">
        <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
          <label>Product</label>
          <input
            type="text"
            list="productList"
            placeholder="Search product"
            autoComplete="off"
            value={line.productSearch}
            onChange={(e) => onProductSearchChange(e.target.value)}
          />
          {hint && <small style={{ fontSize: 12, color: '#0c447c', marginTop: 4, display: 'block' }}>{hint}</small>}
        </div>
        <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
          <label>Description</label>
          <input type="text" placeholder="Optional" value={line.description} onChange={(e) => onPatch({ description: e.target.value })} />
        </div>
        <button className="btn btn-danger btn-sm" style={{ alignSelf: 'center', marginTop: 17 }} onClick={onRemove}>×</button>
      </div>
      {showNewFields && (
        <div className="new-product-fields visible">
          <div className="form-row" style={{ marginTop: 8 }}>
            <div className="form-group">
              <label>Category</label>
              <CategorySelect value={line.category} onChange={(v) => onPatch({ category: v })} />
            </div>
            <div className="form-group">
              <label>Product type</label>
              <ProductTypeSelect products={allProducts} category={line.category} value={line.type} onChange={(v) => onPatch({ type: v })} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <UnitSelect value={line.unit} onChange={(v) => onPatch({ unit: v })} />
            </div>
          </div>
        </div>
      )}
      <div className="receipt-line-amounts" style={{ marginTop: 8 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label># items</label>
          <input type="number" value={line.count} min="1" step="1" style={{ textAlign: 'center' }} onChange={(e) => onCountChange(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Qty / item</label>
          <input type="number" placeholder="0" step="0.001" min="0.001" value={line.qty} onChange={(e) => onPatch({ qty: e.target.value })} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Total all ($)</label>
          <input type="number" placeholder="0.00" step="0.01" min="0.01" value={line.amount} onChange={(e) => onPatch({ amount: e.target.value })} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Unit price</label>
          <div className="unit-price-display">{unitPriceDisplay}</div>
        </div>
      </div>
    </div>
  );
}
