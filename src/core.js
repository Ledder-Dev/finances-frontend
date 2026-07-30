import { state, DEFAULT_PRODUCT_CATEGORIES, UNITS, txDefaultCategories } from './state.js';
import { categoryInput, populateTypeSelect, findProduct } from './ui-helpers.js';
import { loadFamilyMembers, loadFamily, loadBankEnrollments, loadBankBalances, loadPendingTransactions, refreshBankBadge } from './family-bank.js';
import { loadReceipts } from './receipts.js';
import { loadSavings } from './savings.js';
import { loadDebts } from './debts.js';
import { loadAnalysis } from './analysis.js';
import { loadBackground } from './settings.js';

// --- Init ---

export async function loadApp() {
  const now = new Date();
  state.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.toISOString().split('T')[0];

  document.getElementById('purchaseDate').value = today;
  document.getElementById('receiptDate').value = today;

  document.getElementById('purchaseQty').addEventListener('input', () => {
    if (state.lastKnownUnitPrice) {
      const qty = parseFloat(document.getElementById('purchaseQty').value);
      if (qty > 0) document.getElementById('purchaseAmount').value = (qty * state.lastKnownUnitPrice).toFixed(2);
    }
    updateUnitPrice();
  });
  document.getElementById('purchaseAmount').addEventListener('input', updateUnitPrice);
  document.getElementById('productSearch').addEventListener('input', onProductSearch);

  await Promise.all([loadMonths(), loadProducts(), loadStores(), loadProductCategories(), loadTransactionCategories(), loadFamilyMembers(), loadBankEnrollments(), refreshBankBadge()]);
  await loadProductTypes(); // must run after loadProducts so allProducts is ready
  await loadBackground();
  await refreshAll();
}

// --- Mode toggle ---

export function setMode(mode) {
  document.getElementById('form-purchase').style.display = mode === 'purchase' ? 'block' : 'none';
  document.getElementById('form-receipt').style.display = mode === 'receipt' ? 'block' : 'none';
  document.getElementById('btn-mode-purchase').classList.toggle('active', mode === 'purchase');
  document.getElementById('btn-mode-receipt').classList.toggle('active', mode === 'receipt');
}

// --- Tabs ---

export function switchTab(name) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  document.querySelectorAll('.tab').forEach(t => {
    const label = t.textContent.trim().toLowerCase();
    const match = name === 'transactions' ? 'income' : name;
    if (label.includes(match)) t.classList.add('active');
  });
  if (name === 'bank')     { loadBankEnrollments(); loadBankBalances(); loadPendingTransactions(); }
  if (name === 'family')   { loadFamily(); }
  if (name === 'products') { loadProductsTab(); }
}

// --- Month ---

export async function loadMonths() {
  const res = await fetch('/api/months');
  const { data } = await res.json();
  const months = data.length ? data : [state.currentMonth];
  if (!months.includes(state.currentMonth)) months.unshift(state.currentMonth);

  const sel = document.getElementById('monthSelect');
  sel.innerHTML = '';
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    opt.selected = m === state.currentMonth;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => { state.currentMonth = e.target.value; refreshAll(); });
}

export async function refreshAll() {
  await Promise.all([loadSummary(), loadReceipts(), loadTransactions(), loadSavings(), loadDebts(), loadAnalysis()]);
}

// --- Summary ---

export async function loadSummary() {
  const res = await fetch(`/api/summary?month=${state.currentMonth}`);
  const { data } = await res.json();
  const grid = document.getElementById('summaryGrid');
  grid.innerHTML = '';

  const totalSpending = data.categories.reduce((s, c) => s + c.total, 0) + data.tax;
  const spendingPct = data.income > 0 ? totalSpending / data.income * 100 : 0;
  const netCls = data.net >= 0 ? 'net-positive' : 'net-negative';

  const breakdownItems = [
    ...data.categories.map(c => ({ label: c.category, value: c.total })),
    ...(data.tax > 0 ? [{ label: 'Tax', value: data.tax }] : []),
  ].sort((a, b) => b.value - a.value);

  grid.innerHTML = `
    <div class="summary-top">
      <div class="summary-hero summary-hero--income">
        <div class="sh-label">Income</div>
        <div class="sh-value income">$${data.income.toFixed(2)}</div>
      </div>
      <div class="summary-hero summary-hero--spent">
        <div class="sh-label">Total spent</div>
        <div class="sh-value expense">$${totalSpending.toFixed(2)}</div>
        ${data.income > 0 ? `<div class="sh-sub">${spendingPct.toFixed(1)}% of income</div>` : ''}
      </div>
      <div class="summary-hero summary-hero--net">
        <div class="sh-label">Net</div>
        <div class="sh-value ${netCls}">$${data.net.toFixed(2)}</div>
      </div>
    </div>
    ${breakdownItems.length ? `
    <div class="summary-breakdown">
      <div class="bd-header">
        <span class="bd-title">Breakdown</span>
        <span class="bd-total">${breakdownItems.length} categories · $${totalSpending.toFixed(2)}</span>
      </div>
      ${breakdownItems.map(item => {
        const pct = totalSpending > 0 ? item.value / totalSpending * 100 : 0;
        const incomePct = data.income > 0 ? item.value / data.income * 100 : 0;
        return `
          <div class="bd-row">
            <div class="bd-label">${item.label}</div>
            <div class="bd-bar-wrap">
              <div class="bd-bar" style="width:${pct.toFixed(2)}%"></div>
            </div>
            <div class="bd-amount">${incomePct.toFixed(1)}%</div>
            <div class="bd-amount bd-amount--main expense">$${item.value.toFixed(2)}</div>
          </div>`;
      }).join('')}
    </div>` : ''}
  `;

}

// --- Stores / Products ---

export async function loadStores() {
  const res = await fetch('/api/stores');
  const { data } = await res.json();
  document.querySelectorAll('[id^="storeList"]').forEach(list => {
    list.innerHTML = data.map(s => `<option value="${s}">`).join('');
  });
}

export async function loadProducts() {
  const res = await fetch('/api/products');
  const { data } = await res.json();
  state.allProducts = data;
  const list = document.getElementById('productList');
  list.innerHTML = data.map(p => `<option value="${p.name}">`).join('');
}

export async function loadProductTypes() {
  const res = await fetch('/api/product-types');
  const { data } = await res.json();
  ['typeList', 'compareTypeList'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = data.map(t => `<option value="${t}">`).join('');
  });
  const sel = document.getElementById('newProductType');
  if (sel) populateTypeSelect(sel, '');
}

export async function loadProductCategories() {
  const res = await fetch('/api/product-categories');
  const { data } = await res.json();
  const all = [...new Set([...DEFAULT_PRODUCT_CATEGORIES, ...data])].sort();
  document.getElementById('productCategoryList').innerHTML = all.map(c => `<option value="${c}">`).join('');
  const sel = document.getElementById('newProductCategory');
  if (sel) sel.innerHTML = all.map(c => `<option value="${c}">${c}</option>`).join('');
}

export async function loadTransactionCategories() {
  const res = await fetch('/api/transaction-categories');
  const { data } = await res.json();
  state.dbTxCategories = data;
  updateTxCategories();
}

export async function createProduct(name, category, product_type, unit) {
  const safeCategory = category && category.trim() ? category.trim() : 'Miscellaneous';
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category: safeCategory, product_type, unit })
  });
  const json = await res.json();
  if (!json.success) { alert(`Could not create product "${name}": ${json.error}`); return null; }
  await Promise.all([loadProducts(), loadProductCategories()]);
  await loadProductTypes();
  return json.data.id;
}

// --- Standalone purchase ---

export function onProductSearch() {
  const match = findProduct(document.getElementById('productSearch').value);
  document.getElementById('selectedProductId').value = match ? match.id : '';
  document.getElementById('newProductToggle').style.display = match ? 'none' : 'block';
  const hint = document.getElementById('productPriceHint');
  if (match) {
    document.getElementById('newProductFields').classList.remove('visible');
    state.isNewProduct = false;
    state.lastKnownUnitPrice = match.last_unit_price ? parseFloat(match.last_unit_price) : 0;
    if (state.lastKnownUnitPrice) {
      hint.textContent = `Last price: $${state.lastKnownUnitPrice.toFixed(4)} / ${match.unit}`;
      hint.style.display = 'block';
      const qty = parseFloat(document.getElementById('purchaseQty').value);
      if (qty > 0) {
        document.getElementById('purchaseAmount').value = (qty * state.lastKnownUnitPrice).toFixed(2);
        updateUnitPrice();
      }
    } else {
      hint.style.display = 'none';
    }
  } else {
    state.lastKnownUnitPrice = 0;
    hint.style.display = 'none';
  }
}

export function toggleNewProduct() {
  state.isNewProduct = !state.isNewProduct;
  document.getElementById('newProductFields').classList.toggle('visible', state.isNewProduct);
  document.getElementById('newProductToggle').textContent = state.isNewProduct ? '− Cancel new product' : '+ Add as new product';
}

export function updateUnitPrice() {
  const qty = parseFloat(document.getElementById('purchaseQty').value);
  const amt = parseFloat(document.getElementById('purchaseAmount').value);
  document.getElementById('unitPriceDisplay').textContent = (qty > 0 && amt > 0) ? `$${(amt / qty).toFixed(4)}` : '—';
}

export function onPurchaseTypeChange() {
  const sel = document.getElementById('newProductType');
  const txt = document.getElementById('newProductTypeNew');
  txt.style.display = sel.value === '__new__' ? 'block' : 'none';
}

export function onPurchaseCategoryChange() {
  const category = document.getElementById('newProductCategory').value;
  const typeSel  = document.getElementById('newProductType');
  if (!typeSel) return;
  const prev = typeSel.value;
  populateTypeSelect(typeSel, category);
  if (prev && [...typeSel.options].some(o => o.value === prev)) typeSel.value = prev;
  const txt = document.getElementById('newProductTypeNew');
  if (txt && typeSel.value !== '__new__') txt.style.display = 'none';
}

export async function addPurchase() {
  const productSearch = document.getElementById('productSearch').value.trim();
  const description = document.getElementById('purchaseDesc').value.trim();
  const store = document.getElementById('purchaseStore').value.trim();
  const qty = parseFloat(document.getElementById('purchaseQty').value);
  const amt = parseFloat(document.getElementById('purchaseAmount').value);
  const date = document.getElementById('purchaseDate').value;

  if (!productSearch || !qty || !amt || !date) return alert('Fill in all purchase fields.');

  let productId = document.getElementById('selectedProductId').value;
  if (!productId) {
    if (!state.isNewProduct) return alert('Select an existing product or click "+ Add as new product".');
    const typeSel = document.getElementById('newProductType');
    const product_type = typeSel.value === '__new__'
      ? document.getElementById('newProductTypeNew').value.trim()
      : typeSel.value;
    const unit = document.getElementById('newProductUnit').value;
    if (!product_type) return alert('Select or enter a product type.');
    productId = await createProduct(productSearch, document.getElementById('newProductCategory').value, product_type, unit);
  }

  await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, description, store, quantity: qty, total_amount: amt, month: state.currentMonth, purchased_at: date })
  });

  ['productSearch','purchaseDesc','purchaseStore','purchaseQty','purchaseAmount'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('selectedProductId').value = '';
  document.getElementById('unitPriceDisplay').textContent = '—';
  if (state.isNewProduct) toggleNewProduct();

  await loadStores();
  await loadMonths();
  await refreshAll();
}

// --- Standalone purchases list ---

export function filterProductsTab() {
  const q = document.getElementById('productSearch2').value.toLowerCase().trim();
  document.querySelectorAll('.pt-product-row').forEach(row => {
    const name = row.querySelector('.pt-name')?.textContent.toLowerCase() || '';
    row.style.display = (!q || name.includes(q)) ? '' : 'none';
    // also show/hide the edit panel and history for this row
    const id = row.getAttribute('onclick')?.match(/\d+/)?.[0];
    if (id) {
      const edit = document.getElementById(`pe-${id}`);
      const hist = document.getElementById(`ph-${id}`);
      if (edit) edit.style.display = 'none';
      if (hist && !q) hist.style.display = 'none';
    }
  });
  // Hide category headers and groups that have no visible products
  document.querySelectorAll('.pt-group').forEach(group => {
    const anyVisible = [...group.querySelectorAll('.pt-product-row')].some(r => r.style.display !== 'none');
    group.style.display = anyVisible ? '' : 'none';
  });
  document.querySelectorAll('.pt-cat-header').forEach(header => {
    let next = header.nextElementSibling;
    let anyVisible = false;
    while (next && !next.classList.contains('pt-cat-header')) {
      if (next.classList.contains('pt-group') && next.style.display !== 'none') anyVisible = true;
      next = next.nextElementSibling;
    }
    header.style.display = anyVisible ? '' : 'none';
  });
}

export function toggleProductHistory(productId) {
  const el = document.getElementById(`ph-${productId}`);
  const chevron = document.getElementById(`pt-chevron-${productId}`);
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (chevron) chevron.textContent = open ? '▼' : '▲';
}

function _purchaseEditForm(p, date) {
  return `
    <div class="edit-form" id="edit-form-${p.id}">
      <div class="form-row">
        <div class="form-group"><label>Category</label>${categoryInput(`edit-cat-${p.id}`, null, p.category)}</div>
        <div class="form-group"><label>Description</label><input type="text" id="edit-desc-${p.id}" value="${p.description || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Store</label><input type="text" id="edit-store-${p.id}" value="${p.store || ''}" list="storeList"></div>
        <div class="form-group"><label>Date</label><input type="date" id="edit-date-${p.id}" value="${date}"></div>
      </div>
      <div class="form-row-3">
        <div class="form-group"><label>Quantity</label><input type="number" id="edit-qty-${p.id}" value="${parseFloat(p.quantity)}" step="0.001" min="0.001" oninput="updateEditUnitPrice(${p.id})"></div>
        <div class="form-group"><label>Total ($)</label><input type="number" id="edit-amt-${p.id}" value="${parseFloat(p.total_amount)}" step="0.01" min="0.01" oninput="updateEditUnitPrice(${p.id})"></div>
        <div class="form-group"><label>Unit price</label><div class="unit-price-display" id="edit-uprice-${p.id}">$${parseFloat(p.unit_price).toFixed(4)}</div></div>
      </div>
      <div class="edit-actions">
        <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="savePurchase(${p.id})">Save</button>
        <button class="btn" onclick="toggleEditPurchase(${p.id})">Cancel</button>
      </div>
    </div>`;
}

export function toggleProductEdit(id) {
  const el = document.getElementById(`pe-${id}`);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

export async function saveProduct(id) {
  const name         = document.getElementById(`pe-name-${id}`).value.trim();
  const category     = document.getElementById(`pe-cat-${id}`).value;
  const product_type = document.getElementById(`pe-type-${id}`).value.trim();
  const unit         = document.getElementById(`pe-unit-${id}`).value;
  if (!name || !category || !product_type || !unit) return alert('All fields are required.');
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category, product_type, unit })
  });
  if (!(await res.json()).success) return alert('Failed to save product.');
  await Promise.all([loadProducts(), loadProductTypes(), loadProductsTab()]);
}

export async function deleteProduct(id, name, purchaseCount) {
  const warning = purchaseCount > 0
    ? `"${name}" has ${purchaseCount} purchase record${purchaseCount !== 1 ? 's' : ''}.\n\nIt will be hidden from the product list and autocomplete, but its purchase history will be kept — past spending totals won't change.`
    : `Delete "${name}"?`;
  if (!confirm(warning)) return;
  await fetch(`/api/products/${id}`, { method: 'DELETE' });
  await Promise.all([loadProducts(), loadProductTypes(), loadMonths(), loadSummary(), loadProductsTab()]);
}

export async function loadProductsTab() {
  const container = document.getElementById('productsTabContent');
  if (!container) return;

  const res = await fetch('/api/product-history');
  const { data } = await res.json();

  if (!data.length) {
    container.innerHTML = '<div class="card"><p style="color:#999;font-size:14px;">No purchases recorded yet.</p></div>';
    return;
  }

  // Aggregate per unique product
  const productMap = {};
  data.forEach(p => {
    if (!productMap[p.product_id]) {
      productMap[p.product_id] = { id: p.product_id, name: p.product_name, category: p.category, type: p.product_type, unit: p.unit, purchases: [] };
    }
    productMap[p.product_id].purchases.push(p);
  });

  // Group: category → type → products[]
  const catMap = {};
  Object.values(productMap).forEach(prod => {
    if (!catMap[prod.category]) catMap[prod.category] = {};
    if (!catMap[prod.category][prod.type]) catMap[prod.category][prod.type] = [];
    catMap[prod.category][prod.type].push(prod);
  });

  container.innerHTML = Object.keys(catMap).sort().map(cat => {
    const types = catMap[cat];
    return `
      <div class="pt-cat-header">${cat}</div>
      ${Object.keys(types).sort().map(type => {
        const products = types[type].sort((a, b) => a.name.localeCompare(b.name));
        return `
          <div class="pt-group">
            <div class="pt-group-header">
              <span class="pt-type">${type}</span>
              <span class="pt-count">${products.length} product${products.length > 1 ? 's' : ''}</span>
            </div>
            ${products.map(prod => {
              const bestPrice = Math.min(...prod.purchases.map(p => parseFloat(p.unit_price)));
              const last = prod.purchases[0]; // server returns DESC by date
              const lastDate = last.purchased_at ? last.purchased_at.split('T')[0] : last.month;
              const safeName = prod.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
              return `
                <div class="pt-product-row" onclick="toggleProductHistory(${prod.id})">
                  <div class="pt-row-info">
                    <span class="pt-name">${prod.name}</span>
                    <span class="pt-meta">Last: ${lastDate}${last.store ? ' · ' + last.store : ''}</span>
                  </div>
                  <div class="pt-row-right">
                    <span class="pt-unit-price best-price">$${bestPrice.toFixed(4)}/${prod.unit}</span>
                    <span class="pt-purchases-count">${prod.purchases.length}×</span>
                  </div>
                  <div class="pt-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-sm" onclick="toggleProductEdit(${prod.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${prod.id},'${safeName}',${prod.purchases.length})">Delete</button>
                  </div>
                  <span class="pt-chevron" id="pt-chevron-${prod.id}">▼</span>
                </div>
                <div class="pt-product-edit" id="pe-${prod.id}" style="display:none;">
                  <div class="form-row">
                    <div class="form-group" style="flex:2">
                      <label>Name</label>
                      <input type="text" id="pe-name-${prod.id}" value="${prod.name.replace(/"/g, '&quot;')}">
                    </div>
                    <div class="form-group">
                      <label>Category</label>
                      <select id="pe-cat-${prod.id}">${DEFAULT_PRODUCT_CATEGORIES.map(c => `<option value="${c}"${c===prod.category?' selected':''}>${c}</option>`).join('')}</select>
                    </div>
                    <div class="form-group" style="flex:2">
                      <label>Type</label>
                      <input type="text" id="pe-type-${prod.id}" value="${prod.type.replace(/"/g, '&quot;')}">
                    </div>
                    <div class="form-group">
                      <label>Unit</label>
                      <select id="pe-unit-${prod.id}">${UNITS.map(([v])=>`<option value="${v}"${v===prod.unit?' selected':''}>${v}</option>`).join('')}</select>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;margin-top:6px;">
                    <button class="btn btn-primary btn-sm" onclick="saveProduct(${prod.id})">Save</button>
                    <button class="btn btn-sm" onclick="toggleProductEdit(${prod.id})">Cancel</button>
                  </div>
                </div>
                <div class="pt-history" id="ph-${prod.id}" style="display:none;">
                  ${prod.purchases.map(p => {
                    const date = p.purchased_at ? p.purchased_at.split('T')[0] : p.month;
                    const isBest = Math.abs(parseFloat(p.unit_price) - bestPrice) < 0.00001;
                    return `
                      <div class="pt-history-row" id="pt-row-${p.id}">
                        <div class="pt-row-info">
                          <span class="pt-meta">${date}${p.store ? ' · ' + p.store : ''}${p.description ? ' · ' + p.description : ''} · ${parseFloat(p.quantity)} ${prod.unit}</span>
                        </div>
                        <div class="pt-row-right">
                          <span class="pt-unit-price ${isBest ? 'best-price' : ''}">$${parseFloat(p.unit_price).toFixed(4)}/${prod.unit}</span>
                          <span class="expense" style="font-size:13px;font-weight:500;">$${parseFloat(p.total_amount).toFixed(2)}</span>
                        </div>
                        <div class="pt-actions">
                          <button class="btn btn-sm" onclick="toggleEditPurchase(${p.id})">Edit</button>
                          <button class="btn btn-danger btn-sm" onclick="deletePurchase(${p.id})">Del</button>
                        </div>
                      </div>
                      ${_purchaseEditForm(p, date)}`;
                  }).join('')}
                </div>`;
            }).join('')}
          </div>`;
      }).join('')}`;
  }).join('');
}

export function toggleEditPurchase(id) {
  document.getElementById(`edit-form-${id}`).classList.toggle('visible');
}

export function updateEditUnitPrice(id) {
  const qty = parseFloat(document.getElementById(`edit-qty-${id}`).value);
  const amt = parseFloat(document.getElementById(`edit-amt-${id}`).value);
  document.getElementById(`edit-uprice-${id}`).textContent = (qty > 0 && amt > 0) ? `$${(amt / qty).toFixed(4)}` : '—';
}

export async function savePurchase(id) {
  const category = document.getElementById(`edit-cat-${id}`).value;
  const description = document.getElementById(`edit-desc-${id}`).value.trim();
  const store = document.getElementById(`edit-store-${id}`).value.trim();
  const quantity = parseFloat(document.getElementById(`edit-qty-${id}`).value);
  const total_amount = parseFloat(document.getElementById(`edit-amt-${id}`).value);
  const purchased_at = document.getElementById(`edit-date-${id}`).value;
  if (!quantity || !total_amount || !purchased_at) return alert('Quantity, amount and date are required.');
  await fetch(`/api/purchases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, description, store, quantity, total_amount, purchased_at })
  });
  await Promise.all([loadStores(), loadSummary(), loadProductsTab()]);
}

export async function deletePurchase(id) {
  if (!confirm('Delete this purchase?')) return;
  await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
  await Promise.all([loadMonths(), loadSummary(), loadProductsTab()]);
}

// --- Transactions ---

export function updateTxCategories() {
  const type = document.getElementById('txType').value;
  const all = [...new Set([...txDefaultCategories[type], ...(state.dbTxCategories[type] || [])])];
  const list = document.getElementById('txCategoryList');
  if (list) list.innerHTML = all.map(c => `<option value="${c}">`).join('');
  document.getElementById('txCategory').value = '';
}

export async function addTransaction() {
  const type = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const description = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  if (!amount) return alert('Amount is required.');
  await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, category, description, amount, month: state.currentMonth })
  });
  document.getElementById('txDesc').value = '';
  document.getElementById('txAmount').value = '';
  await loadMonths();
  await loadTransactionCategories();
  await refreshAll();
}

export async function loadTransactions() {
  const res = await fetch(`/api/transactions?month=${state.currentMonth}`);
  const { data } = await res.json();
  const card = document.getElementById('txListCard');
  const list = document.getElementById('txList');
  if (!data.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  list.innerHTML = '';
  data.forEach(t => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-name">${t.description || '—'}<span class="badge">${t.category}</span></div>
          <div class="list-item-meta">${t.month}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-amount ${t.type}">${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toFixed(2)}</div>
        </div>
        <button class="btn btn-sm" onclick="toggleEditTransaction(${t.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})">Delete</button>
      </div>
      <div class="edit-form" id="edit-tx-${t.id}">
        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <select id="etx-type-${t.id}">
              <option value="expense"${t.type === 'expense' ? ' selected' : ''}>Expense</option>
              <option value="income"${t.type === 'income' ? ' selected' : ''}>Income</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="text" id="etx-cat-${t.id}" list="txCategoryList" value="${t.category}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="etx-desc-${t.id}" value="${t.description || ''}">
          </div>
          <div class="form-group">
            <label>Amount ($)</label>
            <input type="number" id="etx-amt-${t.id}" value="${parseFloat(t.amount)}" step="0.01" min="0.01">
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="saveTransaction(${t.id})">Save</button>
          <button class="btn" onclick="toggleEditTransaction(${t.id})">Cancel</button>
        </div>
      </div>
    `;
    list.appendChild(wrapper);
  });
}

export function toggleEditTransaction(id) {
  document.getElementById(`edit-tx-${id}`).classList.toggle('visible');
}

export async function saveTransaction(id) {
  const type = document.getElementById(`etx-type-${id}`).value;
  const category = document.getElementById(`etx-cat-${id}`).value.trim();
  const description = document.getElementById(`etx-desc-${id}`).value.trim();
  const amount = parseFloat(document.getElementById(`etx-amt-${id}`).value);
  if (!category || !amount) return alert('Category and amount are required.');
  await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, category, description, amount })
  });
  await loadTransactionCategories();
  await refreshAll();
}

export async function deleteTransaction(id) {
  await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
  await loadMonths();
  await refreshAll();
}

// --- Compare ---

export async function loadComparison() {
  const product_type = document.getElementById('compareType').value.trim();
  if (!product_type) return;
  const res = await fetch(`/api/compare?product_type=${encodeURIComponent(product_type)}`);
  const { data } = await res.json();
  const card = document.getElementById('compareResultCard');
  const body = document.getElementById('compareTableBody');
  document.getElementById('compareResultTitle').textContent = `${product_type} — ${data.length} purchase(s)`;
  body.innerHTML = '';
  if (!data.length) { card.style.display = 'block'; return; }
  const minPrice = Math.min(...data.map(r => parseFloat(r.unit_price)));
  data.forEach(r => {
    const isBest = parseFloat(r.unit_price) === minPrice;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.product_name}</td>
      <td>${r.purchased_at ? r.purchased_at.split('T')[0] : r.month}</td>
      <td>${parseFloat(r.quantity)}</td>
      <td>${r.unit}</td>
      <td>${r.store || '—'}</td>
      <td>$${parseFloat(r.total_amount).toFixed(2)}</td>
      <td class="${isBest ? 'best-price' : ''}">$${parseFloat(r.unit_price).toFixed(4)} / ${r.unit}${isBest ? ' ✓' : ''}</td>
    `;
    body.appendChild(tr);
  });
  card.style.display = 'block';
}
