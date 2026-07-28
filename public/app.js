let currentMonth = '';
let allProducts = [];
let isNewProduct = false;
let rlCounter = 0;
let lastKnownUnitPrice = 0;
const rlLastUnitPrice = {};
let familyMembers = [];
let heroSavingsTotal = 0;
let heroAvgExpenses12 = 0;
let heroPayableTotal = 0;
let heroReceivableTotal = 0;
const chartInstances = {};

const DEFAULT_PRODUCT_CATEGORIES = ['Miscellaneous','Foods','Cleaning','Hygiene','Medicine','Tools','Clothes','Gifts'];
const UNITS = [['U','unit'],['Oz','ounce'],['Lt','liter'],['Lb','pound']];

const txDefaultCategories = {
  expense: ['Rent', 'Electricity', 'Water', 'Internet', 'Cleaning', 'Transport', 'Miscellaneous'],
  income: ['Salary', 'Transfer', 'Other']
};
let dbTxCategories = { expense: [], income: [] };

// --- Helpers ---

function updateHeroNetSavings() {
  const el = document.getElementById('heroSavings');
  if (!el) return;
  const net = heroSavingsTotal - heroPayableTotal + heroReceivableTotal;
  el.textContent = `$${net.toFixed(2)}`;
}

function updateHeroInvestment() {
  const el = document.getElementById('heroInvestment');
  if (!el) return;
  const netSavings = heroSavingsTotal - heroPayableTotal + heroReceivableTotal;
  const investment = netSavings - 12 * heroAvgExpenses12;
  el.textContent = `$${investment.toFixed(2)}`;
}

function categoryInput(elementId, lineId = null, value = '') {
  const opts = DEFAULT_PRODUCT_CATEGORIES.map(c =>
    `<option value="${c}"${c === value ? ' selected' : ''}>${c}</option>`
  ).join('');
  const onChange = lineId !== null ? `onchange="onRLCategoryChange(${lineId})"` : '';
  return `<select id="${elementId}" ${onChange}><option value="">Select category</option>${opts}</select>`;
}

function populateTypeSelect(selectEl, category) {
  const types = [...new Set(
    allProducts
      .filter(p => !category || p.category === category)
      .map(p => p.product_type)
  )].filter(Boolean).sort();
  selectEl.innerHTML =
    `<option value="">Select type</option>` +
    types.map(t => `<option value="${t}">${t}</option>`).join('') +
    `<option value="__new__">— New type —</option>`;
}

function typeInputHtml(id) {
  const types = [...new Set(allProducts.map(p => p.product_type))].filter(Boolean).sort();
  return `
    <select id="rl-type-${id}" onchange="onRLTypeChange(${id})">
      <option value="">Select type</option>
      ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
      <option value="__new__">— New type —</option>
    </select>
    <input type="text" id="rl-type-new-${id}" placeholder="New product type" style="display:none;margin-top:6px;width:100%;padding:8px 10px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;">
  `;
}

function onRLTypeChange(id) {
  const sel = document.getElementById(`rl-type-${id}`);
  const txt = document.getElementById(`rl-type-new-${id}`);
  txt.style.display = sel.value === '__new__' ? 'block' : 'none';
}

function onRLCategoryChange(id) {
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

function onPurchaseTypeChange() {
  const sel = document.getElementById('newProductType');
  const txt = document.getElementById('newProductTypeNew');
  txt.style.display = sel.value === '__new__' ? 'block' : 'none';
}

function onPurchaseCategoryChange() {
  const category = document.getElementById('newProductCategory').value;
  const typeSel  = document.getElementById('newProductType');
  if (!typeSel) return;
  const prev = typeSel.value;
  populateTypeSelect(typeSel, category);
  if (prev && [...typeSel.options].some(o => o.value === prev)) typeSel.value = prev;
  const txt = document.getElementById('newProductTypeNew');
  if (txt && typeSel.value !== '__new__') txt.style.display = 'none';
}

function unitOptions(selected = '') {
  return UNITS.map(([v, l]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${v} — ${l}</option>`).join('');
}

// --- Auth ---

let authMode = 'login';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function authToken() {
  return localStorage.getItem('authToken');
}

const _fetch = window.fetch;

function apiFetch(url, options = {}) {
  const fullUrl = typeof url === 'string' && url.startsWith('/api/') ? API_BASE + url : url;
  const token = authToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return _fetch(fullUrl, { ...options, headers });
}

window.fetch = async (...args) => {
  const res = await apiFetch(...args);
  if (res.status === 401) {
    localStorage.removeItem('authToken');
    showAuthGate();
  }
  return res;
};

function showAuthGate() {
  document.getElementById('authGate').style.display = 'flex';
  document.querySelector('.container').style.display = 'none';
}

function hideAuthGate() {
  document.getElementById('authGate').style.display = 'none';
  document.querySelector('.container').style.display = '';
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'signup' : 'login';
  document.getElementById('authSubmitBtn').textContent = authMode === 'login' ? 'Log in' : 'Sign up';
  document.getElementById('authToggleText').textContent = authMode === 'login' ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('authToggleBtn').textContent = authMode === 'login' ? 'Sign up' : 'Log in';
  document.getElementById('authError').style.display = 'none';
}

async function submitAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';
  if (!email || !password) {
    errEl.textContent = 'Email and password are required';
    errEl.style.display = 'block';
    return;
  }
  const res = await apiFetch(`/api/auth/${authMode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!body.success) {
    errEl.textContent = body.error || 'Something went wrong';
    errEl.style.display = 'block';
    return;
  }
  localStorage.setItem('authToken', body.data.token);
  hideAuthGate();
  await loadApp();
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('authToken');
  showAuthGate();
}

// --- Init ---

async function init() {
  const res = await apiFetch('/api/auth/me');
  const { data: user } = await res.json();
  if (!user) {
    showAuthGate();
    return;
  }
  hideAuthGate();
  await loadApp();
}

async function loadApp() {
  const now = new Date();
  currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.toISOString().split('T')[0];

  document.getElementById('purchaseDate').value = today;
  document.getElementById('receiptDate').value = today;

  document.getElementById('purchaseQty').addEventListener('input', () => {
    if (lastKnownUnitPrice) {
      const qty = parseFloat(document.getElementById('purchaseQty').value);
      if (qty > 0) document.getElementById('purchaseAmount').value = (qty * lastKnownUnitPrice).toFixed(2);
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

function setMode(mode) {
  document.getElementById('form-purchase').style.display = mode === 'purchase' ? 'block' : 'none';
  document.getElementById('form-receipt').style.display = mode === 'receipt' ? 'block' : 'none';
  document.getElementById('btn-mode-purchase').classList.toggle('active', mode === 'purchase');
  document.getElementById('btn-mode-receipt').classList.toggle('active', mode === 'receipt');
}

// --- Tabs ---

function switchTab(name) {
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

async function loadMonths() {
  const res = await fetch('/api/months');
  const { data } = await res.json();
  const months = data.length ? data : [currentMonth];
  if (!months.includes(currentMonth)) months.unshift(currentMonth);

  const sel = document.getElementById('monthSelect');
  sel.innerHTML = '';
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    opt.selected = m === currentMonth;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => { currentMonth = e.target.value; refreshAll(); });
}

async function refreshAll() {
  await Promise.all([loadSummary(), loadReceipts(), loadTransactions(), loadSavings(), loadDebts(), loadAnalysis()]);
}

async function loadFamilyMembers() {
  const res = await fetch('/api/family-members');
  const { data } = await res.json();
  familyMembers = data;
}

function toggleFamilyEdit() {
  const display = document.getElementById('familyDisplay');
  const edit = document.getElementById('familyEdit');
  display.style.display = display.style.display === 'none' ? 'block' : 'none';
  edit.style.display = edit.style.display === 'none' ? 'block' : 'none';
}

async function saveFamilyNames() {
  await Promise.all(familyMembers.map(m => {
    const val = document.getElementById(`fm-${m.id}`).value.trim();
    if (!val || val === m.name) return Promise.resolve();
    return fetch(`/api/family-members/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: val })
    });
  }));
  await loadFamilyMembers();
  toggleFamilyEdit();
  await loadFamily();
}

// --- Summary ---

async function loadSummary() {
  const res = await fetch(`/api/summary?month=${currentMonth}`);
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

async function saveRemittances() {
  if (!familyMembers.length) return;
  const saves = familyMembers.map(m => {
    const input = document.getElementById(`fr-actual-${m.id}`);
    if (!input || input.value === '') return Promise.resolve();
    const amount = parseFloat(input.value) || 0;
    return fetch('/api/family-remittances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: m.id, month: currentMonth, amount })
    });
  });
  await Promise.all(saves);
  await loadMonths();
  await loadFamily();
}

async function loadFamily() {
  const container = document.getElementById('familyContent');
  if (!container) return;

  const res = await fetch(`/api/summary?month=${currentMonth}`);
  const { data } = await res.json();

  if (data.net <= 0) {
    container.innerHTML = '<p style="color:#999;font-size:14px;">No positive net income this month — remittance calculator not available.</p>';
    return;
  }

  const total  = data.net * 0.05;
  const amounts = [total * 0.28, total * 0.28, total * 0.44 / 3, total * 0.44 / 3, total * 0.44 / 3];
  const pcts    = ['28%', '28%', '14.67%', '14.67%', '14.67%'];
  const names   = familyMembers.length === 5 ? familyMembers.map(m => m.name) : ['Person 1','Person 2','Person 3','Person 4','Person 5'];
  const ids     = familyMembers.length === 5 ? familyMembers.map(m => m.id)   : [0,0,0,0,0];

  const remRes = await fetch(`/api/family-remittances?month=${currentMonth}`);
  const { data: remittances } = await remRes.json();
  const remByMember = {};
  remittances.forEach(r => { remByMember[r.member_id] = r; });

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
      <button class="btn btn-sm" onclick="toggleFamilyEdit()">Edit names</button>
    </div>
    <div class="family-total">
      <span>5% of net ($${data.net.toFixed(2)})</span>
      <span>$${total.toFixed(2)}</span>
    </div>
    <div id="familyDisplay">
      <div style="display:grid;grid-template-columns:1fr 110px 140px;gap:8px;font-size:12px;color:#999;padding:0 0 6px;border-bottom:1px solid rgba(0,0,0,0.08);margin-bottom:2px;">
        <span>Member</span><span style="text-align:right;">Suggested</span><span style="text-align:right;">Actual sent</span>
      </div>
      ${names.map((n, i) => {
        const existing = remByMember[ids[i]];
        const actualVal = existing ? parseFloat(existing.amount).toFixed(2) : '';
        return `
          <div style="display:grid;grid-template-columns:1fr 110px 140px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
            <span class="family-row-label">${n} <span style="font-size:11px;color:#999;">${pcts[i]}</span></span>
            <span class="family-row-amount" style="text-align:right;">$${amounts[i].toFixed(2)}</span>
            <input type="number" id="fr-actual-${ids[i]}" value="${actualVal}" placeholder="0.00" step="0.01" min="0" style="width:100%;padding:5px 8px;border:1px solid rgba(0,0,0,0.12);border-radius:6px;font-size:13px;text-align:right;background:white;color:#333;">
          </div>`;
      }).join('')}
      <div style="margin-top:10px;">
        <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="saveRemittances()">Save remittances</button>
      </div>
    </div>
    <div id="familyEdit" style="display:none;">
      ${names.map((n, i) => `
        <div class="family-row">
          <div class="form-group" style="margin-bottom:0;flex:1;">
            <input type="text" id="fm-${ids[i]}" value="${n}" placeholder="Name">
          </div>
          <span class="family-row-amount" style="min-width:80px;text-align:right;">$${amounts[i].toFixed(2)}</span>
        </div>`).join('')}
      <div class="edit-actions">
        <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="saveFamilyNames()">Save</button>
        <button class="btn" onclick="toggleFamilyEdit()">Cancel</button>
      </div>
    </div>
  `;
}

// --- Stores / Products ---

async function loadStores() {
  const res = await fetch('/api/stores');
  const { data } = await res.json();
  document.querySelectorAll('[id^="storeList"]').forEach(list => {
    list.innerHTML = data.map(s => `<option value="${s}">`).join('');
  });
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const { data } = await res.json();
  allProducts = data;
  const list = document.getElementById('productList');
  list.innerHTML = data.map(p => `<option value="${p.name}">`).join('');
}

async function loadProductTypes() {
  const res = await fetch('/api/product-types');
  const { data } = await res.json();
  ['typeList', 'compareTypeList'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = data.map(t => `<option value="${t}">`).join('');
  });
  const sel = document.getElementById('newProductType');
  if (sel) populateTypeSelect(sel, '');
}

async function loadProductCategories() {
  const res = await fetch('/api/product-categories');
  const { data } = await res.json();
  const all = [...new Set([...DEFAULT_PRODUCT_CATEGORIES, ...data])].sort();
  document.getElementById('productCategoryList').innerHTML = all.map(c => `<option value="${c}">`).join('');
  const sel = document.getElementById('newProductCategory');
  if (sel) sel.innerHTML = all.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function loadTransactionCategories() {
  const res = await fetch('/api/transaction-categories');
  const { data } = await res.json();
  dbTxCategories = data;
  updateTxCategories();
}

async function createProduct(name, category, product_type, unit) {
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

function findProduct(name) {
  return allProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
}

// --- Standalone purchase ---

function onProductSearch() {
  const match = findProduct(document.getElementById('productSearch').value);
  document.getElementById('selectedProductId').value = match ? match.id : '';
  document.getElementById('newProductToggle').style.display = match ? 'none' : 'block';
  const hint = document.getElementById('productPriceHint');
  if (match) {
    document.getElementById('newProductFields').classList.remove('visible');
    isNewProduct = false;
    lastKnownUnitPrice = match.last_unit_price ? parseFloat(match.last_unit_price) : 0;
    if (lastKnownUnitPrice) {
      hint.textContent = `Last price: $${lastKnownUnitPrice.toFixed(4)} / ${match.unit}`;
      hint.style.display = 'block';
      const qty = parseFloat(document.getElementById('purchaseQty').value);
      if (qty > 0) {
        document.getElementById('purchaseAmount').value = (qty * lastKnownUnitPrice).toFixed(2);
        updateUnitPrice();
      }
    } else {
      hint.style.display = 'none';
    }
  } else {
    lastKnownUnitPrice = 0;
    hint.style.display = 'none';
  }
}

function toggleNewProduct() {
  isNewProduct = !isNewProduct;
  document.getElementById('newProductFields').classList.toggle('visible', isNewProduct);
  document.getElementById('newProductToggle').textContent = isNewProduct ? '− Cancel new product' : '+ Add as new product';
}

function updateUnitPrice() {
  const qty = parseFloat(document.getElementById('purchaseQty').value);
  const amt = parseFloat(document.getElementById('purchaseAmount').value);
  document.getElementById('unitPriceDisplay').textContent = (qty > 0 && amt > 0) ? `$${(amt / qty).toFixed(4)}` : '—';
}

async function addPurchase() {
  const productSearch = document.getElementById('productSearch').value.trim();
  const description = document.getElementById('purchaseDesc').value.trim();
  const store = document.getElementById('purchaseStore').value.trim();
  const qty = parseFloat(document.getElementById('purchaseQty').value);
  const amt = parseFloat(document.getElementById('purchaseAmount').value);
  const date = document.getElementById('purchaseDate').value;

  if (!productSearch || !qty || !amt || !date) return alert('Fill in all purchase fields.');

  let productId = document.getElementById('selectedProductId').value;
  if (!productId) {
    if (!isNewProduct) return alert('Select an existing product or click "+ Add as new product".');
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
    body: JSON.stringify({ product_id: productId, description, store, quantity: qty, total_amount: amt, month: currentMonth, purchased_at: date })
  });

  ['productSearch','purchaseDesc','purchaseStore','purchaseQty','purchaseAmount'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('selectedProductId').value = '';
  document.getElementById('unitPriceDisplay').textContent = '—';
  if (isNewProduct) toggleNewProduct();

  await loadStores();
  await loadMonths();
  await refreshAll();
}

// --- Receipt scanning ---

function triggerScan() {
  setMode('receipt');
  document.getElementById('receiptScanInput').click();
}

async function scanReceipt(input) {
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
    rlCounter = 0;

    for (const item of (data.items || [])) {
      const id = rlCounter;
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

function addReceiptLine() {
  const id = rlCounter++;
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

function removeReceiptLine(id) {
  document.getElementById(`rl-${id}`).remove();
  updateReceiptTotals();
}

function onRLSearch(id) {
  const val = document.getElementById(`rl-product-${id}`).value;
  const match = findProduct(val);
  document.getElementById(`rl-pid-${id}`).value = match ? match.id : '';
  document.getElementById(`rl-newpf-${id}`).classList.toggle('visible', !match && val.length > 0);
  const hint = document.getElementById(`rl-hint-${id}`);
  if (match && match.last_unit_price) {
    rlLastUnitPrice[id] = parseFloat(match.last_unit_price);
    if (hint) hint.textContent = `Last: $${rlLastUnitPrice[id].toFixed(4)} / ${match.unit}`;
    if (match.last_quantity) {
      document.getElementById(`rl-qty-${id}`).value = parseFloat(match.last_quantity);
    }
    const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
    const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
    if (qty > 0) {
      document.getElementById(`rl-amt-${id}`).value = (qty * rlLastUnitPrice[id] * count).toFixed(2);
      updateRLPrice(id);
      updateReceiptTotals();
    }
  } else {
    rlLastUnitPrice[id] = 0;
    if (hint) hint.textContent = '';
  }
}

// Qty/item changed — keep total fixed, recalculate unit price (different size = different price per unit)
function onRLQtyInput(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const amt   = parseFloat(document.getElementById(`rl-amt-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  if (qty > 0 && amt > 0) rlLastUnitPrice[id] = amt / count / qty;
  updateRLPrice(id);
  updateReceiptTotals();
}

// # items changed — keep unit price fixed, recalculate total
function onRLCountInput(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  if (rlLastUnitPrice[id] && qty > 0) {
    document.getElementById(`rl-amt-${id}`).value = (rlLastUnitPrice[id] * qty * count).toFixed(2);
  }
  updateRLPrice(id);
  updateReceiptTotals();
}

// Total changed manually — means price changed, update known unit price
function onRLAmtInput(id) {
  const qty   = parseFloat(document.getElementById(`rl-qty-${id}`).value);
  const amt   = parseFloat(document.getElementById(`rl-amt-${id}`).value);
  const count = parseInt(document.getElementById(`rl-count-${id}`).value) || 1;
  if (qty > 0 && amt > 0) rlLastUnitPrice[id] = amt / count / qty;
  updateRLPrice(id);
  updateReceiptTotals();
}

function updateRLPrice(id) {
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

function updateReceiptTotals() {
  let subtotal = 0;
  document.querySelectorAll('[id^="rl-amt-"]').forEach(el => { subtotal += parseFloat(el.value) || 0; });
  const tax = parseFloat(document.getElementById('receiptTax').value) || 0;
  document.getElementById('receiptSubtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('receiptTaxDisplay').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('receiptTotal').textContent = `$${(subtotal + tax).toFixed(2)}`;
}

async function submitReceipt() {
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
    body: JSON.stringify({ store, purchased_at, month: currentMonth, tax, items })
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

async function loadReceipts() {
  const res = await fetch(`/api/receipts?month=${currentMonth}`);
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

async function deleteReceipt(id) {
  if (!confirm('Delete this receipt and all its items?')) return;
  await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
  await loadMonths();
  await refreshAll();
}

function toggleEditReceipt(id) {
  document.getElementById(`edit-receipt-${id}`).classList.toggle('visible');
}

async function saveReceipt(id) {
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

function toggleEditReceiptItem(id) {
  document.getElementById(`edit-ri-${id}`).classList.toggle('visible');
}

function updateEditRIPrice(id) {
  const qty = parseFloat(document.getElementById(`eri-qty-${id}`).value);
  const amt = parseFloat(document.getElementById(`eri-amt-${id}`).value);
  document.getElementById(`eri-uprice-${id}`).textContent = (qty > 0 && amt > 0) ? `$${(amt / qty).toFixed(4)}` : '—';
}

async function saveReceiptItem(id) {
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

// --- Standalone purchases list ---

function filterProductsTab() {
  const q = document.getElementById('productSearch2').value.toLowerCase().trim();
  document.querySelectorAll('.pt-product-row').forEach(row => {
    const name = row.querySelector('.pt-name')?.textContent.toLowerCase() || '';
    const group = row.closest('.pt-group');
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

function toggleProductHistory(productId) {
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

function toggleProductEdit(id) {
  const el = document.getElementById(`pe-${id}`);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function saveProduct(id) {
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

async function deleteProduct(id, name, purchaseCount) {
  const warning = purchaseCount > 0
    ? `"${name}" has ${purchaseCount} purchase record${purchaseCount !== 1 ? 's' : ''}.\n\nIt will be hidden from the product list and autocomplete, but its purchase history will be kept — past spending totals won't change.`
    : `Delete "${name}"?`;
  if (!confirm(warning)) return;
  await fetch(`/api/products/${id}`, { method: 'DELETE' });
  await Promise.all([loadProducts(), loadProductTypes(), loadMonths(), loadSummary(), loadProductsTab()]);
}

async function loadProductsTab() {
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

function toggleEditPurchase(id) {
  document.getElementById(`edit-form-${id}`).classList.toggle('visible');
}

function updateEditUnitPrice(id) {
  const qty = parseFloat(document.getElementById(`edit-qty-${id}`).value);
  const amt = parseFloat(document.getElementById(`edit-amt-${id}`).value);
  document.getElementById(`edit-uprice-${id}`).textContent = (qty > 0 && amt > 0) ? `$${(amt / qty).toFixed(4)}` : '—';
}

async function savePurchase(id) {
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

async function deletePurchase(id) {
  if (!confirm('Delete this purchase?')) return;
  await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
  await Promise.all([loadMonths(), loadSummary(), loadProductsTab()]);
}

// --- Transactions ---

function updateTxCategories() {
  const type = document.getElementById('txType').value;
  const all = [...new Set([...txDefaultCategories[type], ...(dbTxCategories[type] || [])])];
  const list = document.getElementById('txCategoryList');
  if (list) list.innerHTML = all.map(c => `<option value="${c}">`).join('');
  document.getElementById('txCategory').value = '';
}

async function addTransaction() {
  const type = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const description = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  if (!amount) return alert('Amount is required.');
  await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, category, description, amount, month: currentMonth })
  });
  document.getElementById('txDesc').value = '';
  document.getElementById('txAmount').value = '';
  await loadMonths();
  await loadTransactionCategories();
  await refreshAll();
}

async function loadTransactions() {
  const res = await fetch(`/api/transactions?month=${currentMonth}`);
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

function toggleEditTransaction(id) {
  document.getElementById(`edit-tx-${id}`).classList.toggle('visible');
}

async function saveTransaction(id) {
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

async function deleteTransaction(id) {
  await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
  await loadMonths();
  await refreshAll();
}

// --- Savings ---

async function loadSavings() {
  const [savingsRes, tellerRes] = await Promise.all([
    fetch(`/api/savings?month=${currentMonth}`),
    fetch('/api/teller/balances')
  ]);
  const { data } = await savingsRes.json();
  const { data: tellerAccounts } = await tellerRes.json();

  const card = document.getElementById('savingsListCard');
  const list = document.getElementById('savingsList');

  if (!data.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  list.innerHTML = '';

  let totalBalance = 0, totalPrev = 0, hasBalance = false, hasPrev = false;

  data.forEach(a => {
    const deltaHtml = a.delta !== null
      ? `<span class="${a.delta > 0 ? 'savings-delta-positive' : a.delta < 0 ? 'savings-delta-negative' : 'savings-delta-neutral'}">${a.delta > 0 ? '+' : ''}$${a.delta.toFixed(2)}</span>`
      : `<span class="savings-delta-neutral">—</span>`;

    const prevHtml = a.prev_balance !== null ? `$${a.prev_balance.toFixed(2)}` : '—';

    if (a.balance !== null) { totalBalance += a.balance; hasBalance = true; }
    if (a.prev_balance !== null) { totalPrev += a.prev_balance; hasPrev = true; }

    const linked = tellerAccounts && a.teller_account_id
      ? tellerAccounts.find(t => t.account_id === a.teller_account_id)
      : null;

    const balanceCell = linked
      ? `<div class="savings-balance-amt">
           ${a.balance !== null ? '$' + a.balance.toFixed(2) : '—'}
           <div class="savings-linked-name">Auto — ${linked.account_name}</div>
         </div>`
      : `<div style="display:flex;flex-direction:column;gap:4px;">
           <div class="form-group" style="margin-bottom:0;">
             <input type="number" id="sb-${a.id}" value="${a.balance !== null ? a.balance : ''}" placeholder="0.00" step="0.01" style="margin:0;">
           </div>
           ${tellerAccounts && tellerAccounts.length ? `
             <select style="padding:4px 8px;border:1px solid #ddd;border-radius:6px;font-size:12px;color:#666;" onchange="linkSavingsAccount(${a.id}, this.value)">
               <option value="">Link to bank account...</option>
               ${tellerAccounts.map(t => `<option value="${t.account_id}">${t.institution} — ${t.account_name}</option>`).join('')}
             </select>` : ''}
         </div>`;

    const actionsCell = linked
      ? `<div style="display:flex;gap:6px;">
           <button class="btn btn-sm" onclick="unlinkSavingsAccount(${a.id})">Unlink</button>
           <button class="btn btn-danger btn-sm" onclick="deleteSavingsAccount(${a.id})">Delete</button>
         </div>`
      : `<div style="display:flex;gap:6px;">
           <button class="btn btn-sm" onclick="saveBalance(${a.id})">Save</button>
           <button class="btn btn-danger btn-sm" onclick="deleteSavingsAccount(${a.id})">Delete</button>
         </div>`;

    const row = document.createElement('div');
    row.className = 'savings-row';
    row.innerHTML = `
      <div class="savings-row-name">${a.name}</div>
      ${balanceCell}
      <div class="savings-prev-text">Prev: ${prevHtml}</div>
      <div>${deltaHtml}</div>
      ${actionsCell}
    `;
    list.appendChild(row);
  });

  heroSavingsTotal = hasBalance ? totalBalance : 0;
  updateHeroNetSavings();
  updateHeroInvestment();

  if (hasBalance) {
    const totalDelta = hasBalance && hasPrev ? totalBalance - totalPrev : null;
    const totalDeltaHtml = totalDelta !== null
      ? `<span class="${totalDelta > 0 ? 'savings-delta-positive' : totalDelta < 0 ? 'savings-delta-negative' : 'savings-delta-neutral'}">${totalDelta > 0 ? '+' : ''}$${totalDelta.toFixed(2)}</span>`
      : `<span class="savings-delta-neutral">—</span>`;

    const totalsRow = document.createElement('div');
    totalsRow.className = 'savings-row';
    totalsRow.style.cssText = 'border-top:2px solid rgba(0,0,0,0.1);margin-top:4px;font-weight:500;';
    totalsRow.innerHTML = `
      <div class="savings-row-name">Total</div>
      <div class="savings-balance-amt">$${totalBalance.toFixed(2)}</div>
      <div class="savings-prev-text">Prev: ${hasPrev ? '$' + totalPrev.toFixed(2) : '—'}</div>
      <div>${totalDeltaHtml}</div>
      <div></div>
    `;
    list.appendChild(totalsRow);
  }
}

async function addSavingsAccount() {
  const name = document.getElementById('savingsAccountName').value.trim();
  if (!name) return alert('Account name is required.');
  await fetch('/api/savings-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  document.getElementById('savingsAccountName').value = '';
  await loadSavings();
}

async function linkSavingsAccount(accountId, tellerAccountId) {
  if (!tellerAccountId) return;
  await fetch(`/api/savings-accounts/${accountId}/link`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_account_id: tellerAccountId })
  });
  await loadSavings();
}

async function unlinkSavingsAccount(accountId) {
  await fetch(`/api/savings-accounts/${accountId}/link`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_account_id: null })
  });
  await loadSavings();
}

async function saveBalance(accountId) {
  const balance = parseFloat(document.getElementById(`sb-${accountId}`).value);
  if (isNaN(balance)) return alert('Enter a valid amount.');
  await fetch('/api/savings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_id: accountId, month: currentMonth, balance })
  });
  await loadSavings();
}

async function deleteSavingsAccount(id) {
  if (!confirm('Delete this account and all its balance history?')) return;
  await fetch(`/api/savings-accounts/${id}`, { method: 'DELETE' });
  await loadSavings();
}

async function loadDebts() {
  const res = await fetch('/api/debts');
  const { data } = await res.json();
  const card = document.getElementById('debtsCard');
  const list = document.getElementById('debtsList');

  if (!data.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  list.innerHTML = '';

  const receivables = data.filter(d => d.type === 'receivable');
  const payables = data.filter(d => d.type === 'payable');

  const renderSection = (title, items, cls) => {
    if (!items.length) return;
    const openItems = items.filter(d => !d.settled);
    const total = openItems.reduce((s, d) => s + parseFloat(d.amount), 0);

    const header = document.createElement('div');
    header.className = 'debts-section-title';
    header.textContent = title;
    list.appendChild(header);

    items.forEach(d => {
      const row = document.createElement('div');
      row.className = `list-item${d.settled ? ' debt-settled' : ''}`;
      row.innerHTML = `
        <div class="list-item-info">
          <div class="list-item-name">${d.person}${d.description ? ' · ' + d.description : ''}</div>
          <div class="list-item-meta">${d.month}${d.settled ? ' · settled' : ''}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-amount ${cls}">$${parseFloat(d.amount).toFixed(2)}</div>
        </div>
        ${!d.settled ? `<button class="btn btn-sm" onclick="settleDebt(${d.id})">Settle</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteDebt(${d.id})">Delete</button>
      `;
      list.appendChild(row);
    });

    if (openItems.length) {
      const totalRow = document.createElement('div');
      totalRow.className = 'debts-total';
      totalRow.innerHTML = `<span class="debts-total-label">Total open</span><span class="${cls}">$${total.toFixed(2)}</span>`;
      list.appendChild(totalRow);
    }
  };

  renderSection('Owed to me (receivable)', receivables, 'income');
  renderSection('I owe (payable)', payables, 'expense');

  heroReceivableTotal = receivables.filter(d => !d.settled).reduce((s, d) => s + parseFloat(d.amount), 0);
  heroPayableTotal = payables.filter(d => !d.settled).reduce((s, d) => s + parseFloat(d.amount), 0);
  updateHeroNetSavings();
}

async function addDebt() {
  const type = document.getElementById('debtType').value;
  const person = document.getElementById('debtPerson').value.trim();
  const description = document.getElementById('debtDesc').value.trim();
  const amount = parseFloat(document.getElementById('debtAmount').value);
  if (!person || !amount) return alert('Person and amount are required.');
  await fetch('/api/debts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, person, description, amount })
  });
  document.getElementById('debtPerson').value = '';
  document.getElementById('debtDesc').value = '';
  document.getElementById('debtAmount').value = '';
  await loadDebts();
}

async function settleDebt(id) {
  await fetch(`/api/debts/${id}/settle`, { method: 'PUT' });
  await loadDebts();
}

async function deleteDebt(id) {
  if (!confirm('Delete this entry?')) return;
  await fetch(`/api/debts/${id}`, { method: 'DELETE' });
  await loadDebts();
}

// --- Analysis ---

function trimmedMean(values) {
  if (!values.length) return 0;
  if (values.length < 3) return values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

function renderCharts(months) {
  const card = document.getElementById('analysisChartsCard');
  if (!months.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const sorted = [...months].reverse(); // oldest → newest
  const labels = sorted.map(m => m.month);
  const incomes = sorted.map(m => m.income);
  const expenses = sorted.map(m => m.expenses);
  const nets = sorted.map(m => m.income - m.expenses);

  const baseOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y.toFixed(2)}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
      y: { ticks: { callback: v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`, font: { size: 10 } } }
    }
  };

  [
    { id: 'chartIncome',   data: incomes,  bg: 'rgba(39,80,10,0.55)',    border: '#27500a' },
    { id: 'chartExpenses', data: expenses, bg: 'rgba(121,31,31,0.55)',   border: '#791f1f' },
    { id: 'chartNet',      data: nets,
      bg: nets.map(v => v >= 0 ? 'rgba(39,80,10,0.55)' : 'rgba(121,31,31,0.55)'),
      border: nets.map(v => v >= 0 ? '#27500a' : '#791f1f') },
  ].forEach(({ id, data, bg, border }) => {
    if (chartInstances[id]) chartInstances[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    chartInstances[id] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: 4 }] },
      options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, beginAtZero: true } } }
    });
  });
}

function editAnalysisMonth(month, income, expenses) {
  document.getElementById(`ar-income-${month}`).innerHTML =
    `<input type="number" id="ar-inc-${month}" value="${income.toFixed(2)}" step="0.01" min="0" style="width:90px;text-align:right;">`;
  document.getElementById(`ar-expenses-${month}`).innerHTML =
    `<input type="number" id="ar-exp-${month}" value="${expenses.toFixed(2)}" step="0.01" min="0" style="width:90px;text-align:right;">`;
  document.getElementById(`ar-net-${month}`).textContent = '';
  document.getElementById(`ar-actions-${month}`).innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="saveAnalysisMonth('${month}')">Save</button>
     <button class="btn btn-sm" onclick="loadAnalysis()">Cancel</button>`;
}

async function saveAnalysisMonth(month) {
  const income   = parseFloat(document.getElementById(`ar-inc-${month}`).value);
  const expenses = parseFloat(document.getElementById(`ar-exp-${month}`).value);
  if (isNaN(income) || isNaN(expenses)) return alert('Enter valid amounts.');
  await fetch('/api/monthly-summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, income, expenses })
  });
  await loadAnalysis();
}

async function loadAnalysis() {
  const res = await fetch('/api/analysis');
  const { data } = await res.json();

  const tableEl = document.getElementById('analysisTable');
  if (!tableEl) return;

  if (!data.months.length) {
    tableEl.innerHTML = '<p style="color:#999;font-size:13px;">No data yet.</p>';
    renderCharts([]);
    return;
  }

  renderCharts(data.months);

  tableEl.innerHTML = `
    <table class="compare-table" style="width:100%;">
      <thead>
        <tr>
          <th>Month</th>
          <th style="text-align:right;">Income</th>
          <th style="text-align:right;">Expenses</th>
          <th style="text-align:right;">Net</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${data.months.map(m => {
          const net = m.income - m.expenses;
          const actions = m.source === 'manual'
            ? `<button class="btn btn-sm" onclick="editAnalysisMonth('${m.month}',${m.income},${m.expenses})">Edit</button>
               <button class="btn btn-danger btn-sm" onclick="deleteHistoricalMonth('${m.month}')">Delete</button>`
            : '';
          return `<tr id="analysis-row-${m.month}">
            <td>${m.month}${m.source === 'manual' ? ' <span class="badge">manual</span>' : ''}</td>
            <td style="text-align:right;" class="income" id="ar-income-${m.month}">$${m.income.toFixed(2)}</td>
            <td style="text-align:right;" class="expense" id="ar-expenses-${m.month}">$${m.expenses.toFixed(2)}</td>
            <td style="text-align:right;" class="${net >= 0 ? 'net-positive' : 'net-negative'}" id="ar-net-${m.month}">$${net.toFixed(2)}</td>
            <td style="text-align:right;" id="ar-actions-${m.month}">${actions}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  const now = new Date();
  const realCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const last12 = data.months.filter(m => m.month !== realCurrentMonth).slice(0, 12);
  const allPast = data.months.filter(m => m.month !== realCurrentMonth);

  const heroBanner = document.getElementById('heroBanner');
  if (allPast.length) {
    const historicNet = allPast.reduce((s, m) => s + (m.income - m.expenses), 0);
    const totalIncome = last12.reduce((s, m) => s + m.income, 0);
    const totalExp    = last12.reduce((s, m) => s + m.expenses, 0);
    const expPct      = totalIncome > 0 ? (totalExp / totalIncome * 100) : 0;
    document.getElementById('heroNet').textContent = `$${historicNet.toFixed(2)}`;
    document.getElementById('heroNetMonths').textContent = `${allPast.length} month${allPast.length !== 1 ? 's' : ''}`;
    document.getElementById('heroPct').textContent = `${expPct.toFixed(1)}% of income spent on average (last 12 months)`;
    heroBanner.style.display = 'block';
  } else {
    heroBanner.style.display = 'none';
  }

  const avgCard = document.getElementById('analysisAvgCard');
  if (last12.length >= 2) {
    const avgIncome   = trimmedMean(last12.map(m => m.income));
    const avgExpenses = trimmedMean(last12.map(m => m.expenses));
    const avgNet      = trimmedMean(last12.map(m => m.income - m.expenses));
    heroAvgExpenses12 = avgExpenses;
    updateHeroInvestment();
    document.getElementById('analysisAvg').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <div class="metric">
          <div class="metric-label">Avg Income</div>
          <div class="metric-value income">$${avgIncome.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Avg Expenses</div>
          <div class="metric-value expense">$${avgExpenses.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Avg Net</div>
          <div class="metric-value ${avgNet >= 0 ? 'net-positive' : 'net-negative'}">$${avgNet.toFixed(2)}</div>
        </div>
      </div>
    `;
    avgCard.style.display = 'block';
  } else {
    avgCard.style.display = 'none';
  }

  const catCard = document.getElementById('analysisCatCard');
  if (data.categories.length) {
    const last12Months = new Set(last12.map(m => m.month));
    const catMap = {};
    data.categories.forEach(r => {
      if (!last12Months.has(r.month)) return;
      if (!catMap[r.category]) catMap[r.category] = [];
      catMap[r.category].push(r.total);
    });

    const catAvgs = Object.entries(catMap)
      .map(([category, vals]) => ({ category, avg: trimmedMean(vals), count: vals.length }))
      .sort((a, b) => b.avg - a.avg);

    document.getElementById('analysisCat').innerHTML = `
      <table class="compare-table" style="width:100%;">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align:right;">Avg / month</th>
            <th style="text-align:right;">Months with data</th>
          </tr>
        </thead>
        <tbody>
          ${catAvgs.map(c => `
            <tr>
              <td>${c.category}</td>
              <td style="text-align:right;" class="expense">$${c.avg.toFixed(2)}</td>
              <td style="text-align:right;color:#999;">${c.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    catCard.style.display = 'block';
  } else {
    catCard.style.display = 'none';
  }
}

async function addHistoricalMonth() {
  const month    = document.getElementById('histMonth').value;
  const income   = parseFloat(document.getElementById('histIncome').value) || 0;
  const expenses = parseFloat(document.getElementById('histExpenses').value) || 0;
  if (!month) return alert('Month is required.');
  await fetch('/api/monthly-summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, income, expenses })
  });
  document.getElementById('histIncome').value = '';
  document.getElementById('histExpenses').value = '';
  await loadMonths();
  await loadAnalysis();
}

async function deleteHistoricalMonth(month) {
  if (!confirm(`Delete manual data for ${month}?`)) return;
  await fetch(`/api/monthly-summaries/${encodeURIComponent(month)}`, { method: 'DELETE' });
  await loadMonths();
  await loadAnalysis();
}

// --- Bank Sync (Plaid) ---

let plaidSyncData = [];

async function openPlaidLink() {
  const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
  const { link_token } = await res.json();
  if (!link_token) return alert('Could not initialize bank connection. Check server logs.');
  const handler = Plaid.create({
    token: link_token,
    onSuccess: async (public_token, metadata) => {
      await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token, institution_name: metadata.institution.name })
      });
      await loadBankEnrollments();
    },
    onExit: (err) => { if (err) console.error('Plaid Link exit:', err); }
  });
  handler.open();
}

async function loadBankEnrollments() {
  const res = await fetch('/api/teller/enrollments');
  const { data } = await res.json();
  const el = document.getElementById('bankEnrollmentList');
  if (!el) return;
  if (!data || !data.length) {
    el.innerHTML = '<p style="color:#999;font-size:14px;">No accounts connected yet.</p>';
    return;
  }
  el.innerHTML = data.map(e => `
    <div style="padding:10px 0;border-bottom:1px solid rgba(100,80,40,0.08);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong class="bank-account-name">${e.institution_name}</strong>
          <span class="bank-account-sub" style="margin-left:8px;">Connected ${e.created_at.split('T')[0]}</span>
          ${e.last_synced_at ? `<span class="bank-account-sub" style="margin-left:8px;">Last sync: ${new Date(e.last_synced_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>` : ''}
        </div>
        <button onclick="disconnectEnrollment(${e.id}, '${e.institution_name.replace(/'/g, "\\'")}')" style="background:#fef2f2;color:#ef4444;border:1px solid #fecaca;padding:4px 12px;font-size:12px;border-radius:6px;cursor:pointer;">Disconnect</button>
      </div>
      ${e.sync_error ? `
        <div style="margin-top:8px;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:13px;color:#b91c1c;">
          Connection lost — please disconnect and reconnect this account to restore sync.
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function loadBankBalances() {
  const res = await fetch('/api/teller/balances');
  const { data } = await res.json();
  const card = document.getElementById('bankBalancesCard');
  const list = document.getElementById('bankBalancesList');
  if (!data || !data.length) { card.style.display = 'none'; return; }

  const subtypeLabel = { checking: 'Checking', savings: 'Savings', credit_card: 'Credit Card' };
  const isCredit = s => s === 'credit_card';

  list.innerHTML = data.map(b => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(100,80,40,0.08);">
      <div>
        <div class="bank-account-name">${b.account_name}</div>
        <div class="bank-account-sub">${b.institution} · ${subtypeLabel[b.account_subtype] || b.account_subtype}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:700;color:${isCredit(b.account_subtype) ? '#2b4980' : '#145a30'};">
          $${parseFloat(b.available).toFixed(2)}
        </div>
        <div class="bank-account-sub">${isCredit(b.account_subtype) ? 'Available credit' : 'Available balance'}</div>
      </div>
    </div>
  `).join('');
  card.style.display = 'block';
}

async function disconnectEnrollment(id, name) {
  if (!confirm(`Disconnect ${name}? Already-added transactions are kept.`)) return;
  await fetch(`/api/teller/enrollments/${id}`, { method: 'DELETE' });
  await loadBankEnrollments();
}

async function loadPendingTransactions() {
  const statusEl = document.getElementById('bankSyncStatus');
  const resultsEl = document.getElementById('bankSyncResults');
  if (!statusEl) return;

  let json;
  try {
    const res = await fetch('/api/teller/pending');
    json = await res.json();
  } catch (e) {
    statusEl.innerHTML = '<p style="color:#ef4444;font-size:13px;margin-top:8px;">Network error. Check server logs.</p>';
    return;
  }

  plaidSyncData = json.data;
  updateBankBadge(plaidSyncData.length);

  if (!plaidSyncData.length) {
    statusEl.innerHTML = '<p style="color:#22c55e;font-size:13px;margin-top:8px;">All caught up — no transactions waiting for review.</p>';
    resultsEl.innerHTML = '';
    return;
  }

  statusEl.innerHTML = `<p style="color:#666;font-size:13px;margin-top:8px;">${plaidSyncData.length} transaction(s) waiting for review.</p>`;

  const expCats = [...new Set([...dbTxCategories.expense, ...txDefaultCategories.expense])];
  const incCats = [...new Set([...dbTxCategories.income, ...txDefaultCategories.income])];

  resultsEl.innerHTML = plaidSyncData.map((tx, i) => {
    const cats = tx.type === 'expense' ? expCats : incCats;
    return `
      <div class="card" id="teller-card-${i}" style="border-left:4px solid ${tx.type === 'expense' ? '#ef4444' : '#22c55e'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-weight:600;font-size:15px;">${tx.description}</div>
            <div style="font-size:12px;color:#999;margin-top:2px;">${tx.institution} · ${tx.account_name} · ${tx.date}</div>
          </div>
          <div style="font-size:18px;font-weight:700;color:${tx.type === 'expense' ? '#ef4444' : '#22c55e'};white-space:nowrap;margin-left:12px;">
            ${tx.type === 'income' ? '+' : '-'}$${parseFloat(tx.amount).toFixed(2)}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select id="teller-type-${i}" onchange="onTellerTypeChange(${i})" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
            <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>Expense</option>
            <option value="income" ${tx.type === 'income' ? 'selected' : ''}>Income</option>
          </select>
          <select id="teller-cat-${i}" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;flex:1;min-width:120px;">
            ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <button class="btn btn-primary" style="width:auto;padding:6px 16px;font-size:13px;" onclick="addTellerTransaction(${i})">Add</button>
          <button class="btn" style="width:auto;padding:6px 16px;font-size:13px;background:#f5f5f5;color:#666;" onclick="dismissTellerTransaction(${i})">Skip</button>
        </div>
      </div>
    `;
  }).join('');
}

async function triggerManualSync() {
  const statusEl = document.getElementById('bankSyncStatus');
  statusEl.innerHTML = '<p style="color:#666;font-size:13px;margin-top:8px;">Checking banks — this takes about 30 seconds...</p>';
  await fetch('/api/teller/sync-now', { method: 'POST' });
  setTimeout(async () => {
    await Promise.all([loadBankEnrollments(), loadBankBalances(), loadPendingTransactions(), loadSavings()]);
  }, 30000);
}

function updateBankBadge(count) {
  const badge = document.getElementById('bankBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

async function refreshBankBadge() {
  try {
    const res = await fetch('/api/teller/pending-count');
    const { data } = await res.json();
    updateBankBadge(data.count);
  } catch (e) { /* silent */ }
}

function onTellerTypeChange(i) {
  const type = document.getElementById(`teller-type-${i}`).value;
  const catSel = document.getElementById(`teller-cat-${i}`);
  const cats = type === 'expense'
    ? [...new Set([...dbTxCategories.expense, ...txDefaultCategories.expense])]
    : [...new Set([...dbTxCategories.income, ...txDefaultCategories.income])];
  catSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function addTellerTransaction(i) {
  const tx = plaidSyncData[i];
  const type = document.getElementById(`teller-type-${i}`).value;
  const category = document.getElementById(`teller-cat-${i}`).value;
  await fetch('/api/teller/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_id: tx.teller_id, type, category, description: tx.description, amount: tx.amount, month: tx.month })
  });
  document.getElementById(`teller-card-${i}`).remove();
  await Promise.all([loadTransactions(), loadSummary()]);
}

async function dismissTellerTransaction(i) {
  const tx = plaidSyncData[i];
  await fetch('/api/teller/dismiss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_id: tx.teller_id })
  });
  document.getElementById(`teller-card-${i}`).remove();
}

// --- Compare ---

async function loadComparison() {
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

// --- Settings / Background ---

function openSettings() {
  document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settingsModal').style.display = 'none';
}

async function loadBackground() {
  try {
    const res = await fetch('/api/settings/background');
    const { url } = await res.json();
    if (url) applyBackground(url);
  } catch (e) { /* no background set */ }
}

function applyBackground(url) {
  const dim = parseInt(document.getElementById('bgDimSlider').value, 10);
  document.body.style.backgroundImage = `url(${url})`;
  document.body.style.setProperty('--bg-dim', dim / 100);
  document.body.classList.add('has-bg');
  const preview = document.getElementById('bgPreview');
  const img = document.getElementById('bgPreviewImg');
  img.src = url;
  preview.style.display = 'block';
  document.getElementById('bgRemoveBtn').style.display = '';
  document.getElementById('bgDimGroup').style.display = '';
}

async function uploadBackground(input) {
  if (!input.files || !input.files[0]) return;
  const formData = new FormData();
  formData.append('image', input.files[0]);
  const res = await fetch('/api/settings/background', { method: 'POST', body: formData });
  if (!res.ok) { alert('Upload failed'); return; }
  const { url } = await res.json();
  applyBackground(url);
}

async function removeBackground() {
  await fetch('/api/settings/background', { method: 'DELETE' });
  document.body.style.backgroundImage = '';
  document.body.classList.remove('has-bg');
  document.getElementById('bgPreview').style.display = 'none';
  document.getElementById('bgPreviewImg').src = '';
  document.getElementById('bgRemoveBtn').style.display = 'none';
  document.getElementById('bgDimGroup').style.display = 'none';
  document.getElementById('bgInput').value = '';
}

function onDimChange(value) {
  document.getElementById('bgDimValue').textContent = value;
  document.body.style.setProperty('--bg-dim', value / 100);
}

init();
