import { state } from './state.js';
import { categoryInput, typeInputHtml, unitOptions, findProduct, populateTypeSelect } from './ui-helpers.js';
import { createProduct, loadStores, loadMonths, refreshAll, setMode } from './core.js';

// --- Receipt scanning ---

export function triggerScan() {
  setMode('receipt');
  document.getElementById('receiptScanInput').click();
}

export async function scanReceipt(input) {
  const file = input.files[0];
  if (!file) return;

  const btn = document.getElementById('btn-scan-receipt');
  const origText = btn.textContent;
  btn.textContent = 'Scanning...';
  btn.disabled = true;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/api/scan-receipt', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Scan failed');
    const { data } = await res.json();

    if (data.store) document.getElementById('receiptStore').value = data.store;
    if (data.date) document.getElementById('receiptDate').value = data.date;
    document.getElementById('receiptTax').value = (data.tax || 0).toFixed(2);
    updateReceiptTotals();

    document.getElementById('receiptLines').innerHTML = '';
    state.rlCounter = 0;

    for (const item of (data.items || [])) {
      const id = state.rlCounter;
      addReceiptLine();
      document.getElementById(`rl-product-${id}`).value = item.name || '';
      document.getElementById(`rl-qty-${id}`).value = item.quantity || 1;
      document.getElementById(`rl-amt-${id}`).value = (item.total || 0).toFixed(2);
      onRLSearch(id);
      updateRLPrice(id);
    }

    updateReceiptTotals();
  } catch (e) {
    alert('Could not scan receipt. Check your OpenAI API key and try again.');
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
    input.value = '';
  }
}

// --- Receipt form ---

export function addReceiptLine() {
  const id = state.rlCounter++;
  const div = document.createElement('div');
  div.className = 'receipt-line';
  div.id = `rl-${id}`;
  div.innerHTML = `
    <div class="receipt-line-header">
      <div class="form-group" style="flex:2;margin-bottom:0;">
        <label>Product</label>
        <input type="text" id="rl-product-${id}" list="productList" placeholder="Search product" autocomplete="off" oninput="onRLSearch(${id})">
        <input type="hidden" id="rl-pid-${id}">
        <small id="rl-hint-${id}" style="font-size:12px;color:#0c447c;margin-top:4px;display:block;"></small>
      </div>
      <div class="form-group" style="flex:2;margin-bottom:0;">
        <label>Description</label>
        <input type="text" id="rl-desc-${id}" placeholder="Optional">
      </div>
      <button class="btn btn-danger btn-sm" style="align-self:center;margin-top:17px;" onclick="removeReceiptLine(${id})">×</button>
    </div>
    <div class="new-product-fields" id="rl-newpf-${id}">
      <div class="form-row" style="margin-top:8px;">
        <div class="form-group">
          <label>Category</label>
          ${categoryInput(`rl-cat-${id}`, id)}
        </div>
        <div class="form-group">
          <label>Product type</label>
          ${typeInputHtml(id)}
        </div>
        <div class="form-group">
          <label>Unit</label>
          <select id="rl-unit-${id}">${unitOptions()}</select>
        </div>
      </div>
    </div>
    <div class="receipt-line-amounts" style="margin-top:8px;">
      <div class="form-group" style="margin-bottom:0;">
        <label># items</label>
        <input type="number" id="rl-count-${id}" value="1" min="1" step="1" style="text-align:center;" oninput="onRLCountInput(${id})">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Qty / item</label>
        <input type="number" id="rl-qty-${id}" placeholder="0" step="0.001" min="0.001" oninput="onRLQtyInput(${id})">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Total all ($)</label>
        <input type="number" id="rl-amt-${id}" placeholder="0.00" step="0.01" min="0.01" oninput="onRLAmtInput(${id})">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Unit price</label>
        <div class="unit-price-display" id="rl-uprice-${id}">—</div>
      </div>
    </div>
  `;
  document.getElementById('receiptLines').appendChild(div);
}

export function removeReceiptLine(id) {
  document.getElementById(`rl-${id}`).remove();
  updateReceiptTotals();
}

export function onRLSearch(id) {
  const val = document.getElementById(`rl-product-${id}`).value;
  const match = findProduct(val);
  document.getElementById(`rl-pid-${id}`).value = match ? match.id : '';
  document.getElementById(`rl-newpf-${id}`).classList.toggle('visible', !match && val.length > 0);
  const hint = document.getElementById(`rl-hint-${id}`);
  if (match && match.last_unit_price) {
    state.rlLastUnitPrice[id] = parseFloat(match.last_unit_price);
    if (hint) hint.textContent = `Last: $${state.rlLastUnitPrice[id].toFixed(4)} / ${match.unit}`;
    if (match.last_quantity) {
      document.getElementById(`rl-qty-${id}`).value = parseFloat(match.last_quantity);
    }
    const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
    const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
    if (qty > 0) {
      document.getElementById(`rl-amt-${id}`).value = (qty * state.rlLastUnitPrice[id] * count).toFixed(2);
      updateRLPrice(id);
      updateReceiptTotals();
    }
  } else {
    state.rlLastUnitPrice[id] = 0;
    if (hint) hint.textContent = '';
  }
}

// Qty/item changed — keep total fixed, recalculate unit price (different size = different price per unit)
export function onRLQtyInput(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const amt   = parseFloat(document.getElementById(`rl-amt-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  if (qty > 0 && amt > 0) state.rlLastUnitPrice[id] = amt / count / qty;
  updateRLPrice(id);
  updateReceiptTotals();
}

// # items changed — keep unit price fixed, recalculate total
export function onRLCountInput(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  if (state.rlLastUnitPrice[id] && qty > 0) {
    document.getElementById(`rl-amt-${id}`).value = (state.rlLastUnitPrice[id] * qty * count).toFixed(2);
  }
  updateRLPrice(id);
  updateReceiptTotals();
}

// Total changed manually — means price changed, update known unit price
export function onRLAmtInput(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const amt   = parseFloat(document.getElementById(`rl-amt-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  if (qty > 0 && amt > 0) state.rlLastUnitPrice[id] = amt / count / qty;
  updateRLPrice(id);
  updateReceiptTotals();
}

export function onRLTypeChange(id) {
  const sel = document.getElementById(`rl-type-${id}`);
  const txt = document.getElementById(`rl-type-new-${id}`);
  txt.style.display = sel.value === '__new__' ? 'block' : 'none';
}

export function onRLCategoryChange(id) {
  const category = document.getElementById(`rl-cat-${id}`).value;
  const typeSel  = document.getElementById(`rl-type-${id}`);
  if (typeSel) {
    const prev = typeSel.value;
    populateTypeSelect(typeSel, category);
    if (prev && [...typeSel.options].some(o => o.value === prev)) typeSel.value = prev;
  }
  const txt = document.getElementById(`rl-type-new-${id}`);
  if (txt && document.getElementById(`rl-type-${id}`).value !== '__new__') txt.style.display = 'none';
}

export function updateRLPrice(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const amt   = parseFloat(document.getElementById(`rl-amt-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  const el    = document.getElementById(`rl-uprice-${id}`);
  if (!qty || !amt) { el.textContent = '—'; return; }
  const perItem = amt / count;
  const unitPrice = perItem / qty;
  el.textContent = count > 1
    ? `$${unitPrice.toFixed(4)} (×${count}: $${perItem.toFixed(2)}/item)`
    : `$${unitPrice.toFixed(4)}`;
}

export function updateReceiptTotals() {
  let subtotal = 0;
  document.querySelectorAll('[id^="rl-amt-"]').forEach(el => { subtotal += parseFloat(el.value) || 0; });
  const tax = parseFloat(document.getElementById('receiptTax').value) || 0;
  document.getElementById('receiptSubtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('receiptTaxDisplay').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('receiptTotal').textContent = `$${(subtotal + tax).toFixed(2)}`;
}

export async function submitReceipt() {
  const store = document.getElementById('receiptStore').value.trim();
  const purchased_at = document.getElementById('receiptDate').value;
  const tax = parseFloat(document.getElementById('receiptTax').value) || 0;

  if (!store || !purchased_at) return alert('Store and date are required.');

  const lineIds = [...document.getElementById('receiptLines').children].map(el => el.id.replace('rl-', ''));
  if (!lineIds.length) return alert('Add at least one item.');

  const items = [];
  for (const id of lineIds) {
    const productSearch = document.getElementById(`rl-product-${id}`).value.trim();
    const qty = parseFloat(document.getElementById(`rl-qty-${id}`).value);
    const amt = parseFloat(document.getElementById(`rl-amt-${id}`).value);
    if (!productSearch || !qty || !amt) return alert(`Fill in all fields for item "${productSearch || id}".`);

    let productId = document.getElementById(`rl-pid-${id}`).value;
    if (!productId) {
      const typeSel = document.getElementById(`rl-type-${id}`);
      const product_type = typeSel.value === '__new__'
        ? document.getElementById(`rl-type-new-${id}`).value.trim()
        : typeSel.value;
      const unit = document.getElementById(`rl-unit-${id}`).value;
      const category = document.getElementById(`rl-cat-${id}`).value;
      if (!product_type) return alert(`Select or enter a product type for "${productSearch}".`);
      productId = await createProduct(productSearch, category, product_type, unit);
      if (!productId) return;
    }

    const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
    const perItemAmt = amt / count;
    const desc = document.getElementById(`rl-desc-${id}`).value.trim();
    for (let i = 0; i < count; i++) {
      items.push({ product_id: productId, description: desc, quantity: qty, total_amount: perItemAmt });
    }
  }

  await fetch('/api/receipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store, purchased_at, month: state.currentMonth, tax, items })
  });

  document.getElementById('receiptStore').value = '';
  document.getElementById('receiptTax').value = '0';
  document.getElementById('receiptLines').innerHTML = '';
  updateReceiptTotals();

  await loadStores();
  await loadMonths();
  await refreshAll();
}

// --- Load receipts ---

export async function loadReceipts() {
  const res = await fetch(`/api/receipts?month=${state.currentMonth}`);
  const { data } = await res.json();
  const section = document.getElementById('receiptsListSection');
  const list = document.getElementById('receiptsList');

  if (!data.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = '';

  data.forEach(r => {
    const date = r.purchased_at ? r.purchased_at.split('T')[0] : r.month;
    const div = document.createElement('div');
    div.className = 'receipt-group';
    div.innerHTML = `
      <div class="receipt-group-header">
        <div>
          <div class="receipt-group-header-left">${r.store}</div>
          <div class="receipt-group-header-meta">${date} · ${r.items.length} item(s)</div>
        </div>
        <div class="receipt-group-header-right">
          <div>
            <div class="receipt-group-total">$${r.total.toFixed(2)}</div>
            ${r.tax > 0 ? `<div class="receipt-group-tax">subtotal $${r.subtotal.toFixed(2)} + tax $${r.tax.toFixed(2)}</div>` : ''}
          </div>
          <button class="btn btn-sm" onclick="toggleEditReceipt(${r.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteReceipt(${r.id})">Delete</button>
        </div>
      </div>
      <div class="edit-form" id="edit-receipt-${r.id}" style="padding:12px 14px;border-bottom:1px solid rgba(0,0,0,0.07);">
        <div class="form-row-3">
          <div class="form-group">
            <label>Store</label>
            <input type="text" id="er-store-${r.id}" value="${r.store}" list="storeList">
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="er-date-${r.id}" value="${date}">
          </div>
          <div class="form-group">
            <label>Tax ($)</label>
            <input type="number" id="er-tax-${r.id}" value="${r.tax.toFixed(2)}" step="0.01" min="0">
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="saveReceipt(${r.id})">Save</button>
          <button class="btn" onclick="toggleEditReceipt(${r.id})">Cancel</button>
        </div>
      </div>
      <div class="receipt-group-items">
        ${r.items.map(p => `
          <div class="list-item" id="ri-row-${p.id}">
            <div class="list-item-info">
              <div class="list-item-name">${p.product_name}<span class="badge">${p.category}</span><span class="badge">${p.product_type}</span></div>
              <div class="list-item-meta">${parseFloat(p.quantity)} ${p.unit}${p.description ? ' · ' + p.description : ''}</div>
            </div>
            <div class="list-item-right">
              <div class="list-item-amount expense">$${parseFloat(p.total_amount).toFixed(2)}</div>
              <div class="list-item-unit-price">$${parseFloat(p.unit_price).toFixed(4)} / ${p.unit}</div>
            </div>
            <button class="btn btn-sm" onclick="toggleEditReceiptItem(${p.id})">Edit</button>
          </div>
          <div class="edit-form" id="edit-ri-${p.id}">
            <input type="hidden" id="eri-date-${p.id}" value="${p.purchased_at ? p.purchased_at.split('T')[0] : date}">
            <input type="hidden" id="eri-store-${p.id}" value="${p.store || r.store}">
            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                ${categoryInput(`eri-cat-${p.id}`, p.category)}
              </div>
              <div class="form-group">
                <label>Description</label>
                <input type="text" id="eri-desc-${p.id}" value="${p.description || ''}">
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="eri-qty-${p.id}" value="${parseFloat(p.quantity)}" step="0.001" min="0.001" oninput="updateEditRIPrice(${p.id})">
              </div>
              <div class="form-group">
                <label>Total amount ($)</label>
                <input type="number" id="eri-amt-${p.id}" value="${parseFloat(p.total_amount)}" step="0.01" min="0.01" oninput="updateEditRIPrice(${p.id})">
              </div>
              <div class="form-group">
                <label>Unit price (auto)</label>
                <div class="unit-price-display" id="eri-uprice-${p.id}">$${parseFloat(p.unit_price).toFixed(4)}</div>
              </div>
            </div>
            <div class="edit-actions">
              <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="saveReceiptItem(${p.id})">Save</button>
              <button class="btn" onclick="toggleEditReceiptItem(${p.id})">Cancel</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    list.appendChild(div);
  });
}

export async function deleteReceipt(id) {
  if (!confirm('Delete this receipt and all its items?')) return;
  await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
  await loadMonths();
  await refreshAll();
}

export function toggleEditReceipt(id) {
  document.getElementById(`edit-receipt-${id}`).classList.toggle('visible');
}

export async function saveReceipt(id) {
  const store = document.getElementById(`er-store-${id}`).value.trim();
  const purchased_at = document.getElementById(`er-date-${id}`).value;
  const tax = parseFloat(document.getElementById(`er-tax-${id}`).value) || 0;
  if (!store || !purchased_at) return alert('Store and date are required.');
  await fetch(`/api/receipts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store, purchased_at, tax })
  });
  await loadStores();
  await loadMonths();
  await refreshAll();
}

export function toggleEditReceiptItem(id) {
  document.getElementById(`edit-ri-${id}`).classList.toggle('visible');
}

export function updateEditRIPrice(id) {
  const qty = parseFloat(document.getElementById(`eri-qty-${id}`).value);
  const amt = parseFloat(document.getElementById(`eri-amt-${id}`).value);
  document.getElementById(`eri-uprice-${id}`).textContent = (qty > 0 && amt > 0) ? `$${(amt / qty).toFixed(4)}` : '—';
}

export async function saveReceiptItem(id) {
  const category = document.getElementById(`eri-cat-${id}`).value;
  const description = document.getElementById(`eri-desc-${id}`).value.trim();
  const quantity = parseFloat(document.getElementById(`eri-qty-${id}`).value);
  const total_amount = parseFloat(document.getElementById(`eri-amt-${id}`).value);
  const purchased_at = document.getElementById(`eri-date-${id}`).value;
  const store = document.getElementById(`eri-store-${id}`).value;
  if (!quantity || !total_amount) return alert('Quantity and amount are required.');
  await fetch(`/api/purchases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, description, store, quantity, total_amount, purchased_at })
  });
  await refreshAll();
}
