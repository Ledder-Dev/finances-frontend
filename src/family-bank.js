import { state, txDefaultCategories } from './state.js';
import { loadTransactions, loadSummary, loadMonths } from './core.js';
import { loadSavings } from './savings.js';

// --- Family ---

export async function loadFamilyMembers() {
  const res = await fetch('/api/family-members');
  const { data } = await res.json();
  state.familyMembers = data;
}

export function toggleFamilyEdit() {
  const display = document.getElementById('familyDisplay');
  const edit = document.getElementById('familyEdit');
  display.style.display = display.style.display === 'none' ? 'block' : 'none';
  edit.style.display = edit.style.display === 'none' ? 'block' : 'none';
}

export async function saveFamilyNames() {
  await Promise.all(state.familyMembers.map(m => {
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

export async function saveRemittances() {
  if (!state.familyMembers.length) return;
  const saves = state.familyMembers.map(m => {
    const input = document.getElementById(`fr-actual-${m.id}`);
    if (!input || input.value === '') return Promise.resolve();
    const amount = parseFloat(input.value) || 0;
    return fetch('/api/family-remittances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: m.id, month: state.currentMonth, amount })
    });
  });
  await Promise.all(saves);
  await loadMonths();
  await loadFamily();
}

export async function loadFamily() {
  const container = document.getElementById('familyContent');
  if (!container) return;

  const res = await fetch(`/api/summary?month=${state.currentMonth}`);
  const { data } = await res.json();

  if (data.net <= 0) {
    container.innerHTML = '<p style="color:#999;font-size:14px;">No positive net income this month — remittance calculator not available.</p>';
    return;
  }

  const total  = data.net * 0.05;
  const amounts = [total * 0.28, total * 0.28, total * 0.44 / 3, total * 0.44 / 3, total * 0.44 / 3];
  const pcts    = ['28%', '28%', '14.67%', '14.67%', '14.67%'];
  const names   = state.familyMembers.length === 5 ? state.familyMembers.map(m => m.name) : ['Person 1','Person 2','Person 3','Person 4','Person 5'];
  const ids     = state.familyMembers.length === 5 ? state.familyMembers.map(m => m.id)   : [0,0,0,0,0];

  const remRes = await fetch(`/api/family-remittances?month=${state.currentMonth}`);
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

// --- Bank Sync (Plaid) ---

export async function openPlaidLink() {
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

export async function loadBankEnrollments() {
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
      ${e.sync_error ? (() => {
        const loginRequired = e.sync_error.startsWith('Login required');
        const bg = loginRequired ? '#fef2f2' : '#fffbeb';
        const border = loginRequired ? '#fecaca' : '#fde68a';
        const color = loginRequired ? '#b91c1c' : '#92400e';
        return `
        <div style="margin-top:8px;padding:8px 12px;background:${bg};border:1px solid ${border};border-radius:6px;font-size:13px;color:${color};">
          ${e.sync_error}
        </div>
      `;
      })() : ''}
    </div>
  `).join('');
}

export async function loadBankBalances() {
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

export async function disconnectEnrollment(id, name) {
  if (!confirm(`Disconnect ${name}? Already-added transactions are kept.`)) return;
  await fetch(`/api/teller/enrollments/${id}`, { method: 'DELETE' });
  await loadBankEnrollments();
}

export async function loadPendingTransactions() {
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

  state.plaidSyncData = json.data;
  updateBankBadge(state.plaidSyncData.length);

  if (!state.plaidSyncData.length) {
    statusEl.innerHTML = '<p style="color:#22c55e;font-size:13px;margin-top:8px;">All caught up — no transactions waiting for review.</p>';
    resultsEl.innerHTML = '';
    return;
  }

  statusEl.innerHTML = `<p style="color:#666;font-size:13px;margin-top:8px;">${state.plaidSyncData.length} transaction(s) waiting for review.</p>`;

  const expCats = [...new Set([...state.dbTxCategories.expense, ...txDefaultCategories.expense])];
  const incCats = [...new Set([...state.dbTxCategories.income, ...txDefaultCategories.income])];

  resultsEl.innerHTML = state.plaidSyncData.map((tx, i) => {
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
          <input type="text" id="teller-cat-${i}" list="teller-cat-list-${i}" value="${cats[0] || ''}" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;flex:1;min-width:120px;">
          <datalist id="teller-cat-list-${i}">${cats.map(c => `<option value="${c}">`).join('')}</datalist>
          <button class="btn btn-primary" style="width:auto;padding:6px 16px;font-size:13px;" onclick="addTellerTransaction(${i})">Add</button>
          <button class="btn" style="width:auto;padding:6px 16px;font-size:13px;background:#f5f5f5;color:#666;" onclick="dismissTellerTransaction(${i})">Skip</button>
        </div>
      </div>
    `;
  }).join('');
}

export async function triggerManualSync() {
  const statusEl = document.getElementById('bankSyncStatus');
  statusEl.innerHTML = '<p style="color:#666;font-size:13px;margin-top:8px;">Checking banks — this takes about 30 seconds...</p>';
  await fetch('/api/teller/sync-now', { method: 'POST' });
  setTimeout(async () => {
    await Promise.all([loadBankEnrollments(), loadBankBalances(), loadPendingTransactions(), loadSavings()]);
  }, 30000);
}

export function updateBankBadge(count) {
  const badge = document.getElementById('bankBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

export async function refreshBankBadge() {
  try {
    const res = await fetch('/api/teller/pending-count');
    const { data } = await res.json();
    updateBankBadge(data.count);
  } catch (e) { /* silent */ }
}

export function onTellerTypeChange(i) {
  const type = document.getElementById(`teller-type-${i}`).value;
  const catList = document.getElementById(`teller-cat-list-${i}`);
  const cats = type === 'expense'
    ? [...new Set([...state.dbTxCategories.expense, ...txDefaultCategories.expense])]
    : [...new Set([...state.dbTxCategories.income, ...txDefaultCategories.income])];
  catList.innerHTML = cats.map(c => `<option value="${c}">`).join('');
  document.getElementById(`teller-cat-${i}`).value = cats[0] || '';
}

export async function addTellerTransaction(i) {
  const tx = state.plaidSyncData[i];
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

export async function dismissTellerTransaction(i) {
  const tx = state.plaidSyncData[i];
  await fetch('/api/teller/dismiss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_id: tx.teller_id })
  });
  document.getElementById(`teller-card-${i}`).remove();
}
