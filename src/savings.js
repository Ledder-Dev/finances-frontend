import { state } from './state.js';
import { updateHeroNetSavings, updateHeroInvestment } from './hero.js';

export async function loadSavings() {
  const [savingsRes, tellerRes] = await Promise.all([
    fetch(`/api/savings?month=${state.currentMonth}`),
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

    const linked = tellerAccounts && a.plaid_account_id
      ? tellerAccounts.find(t => t.account_id === a.plaid_account_id)
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

  state.heroSavingsTotal = hasBalance ? totalBalance : 0;
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

export async function addSavingsAccount() {
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

export async function linkSavingsAccount(accountId, tellerAccountId) {
  if (!tellerAccountId) return;
  await fetch(`/api/savings-accounts/${accountId}/link`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_account_id: tellerAccountId })
  });
  await loadSavings();
}

export async function unlinkSavingsAccount(accountId) {
  await fetch(`/api/savings-accounts/${accountId}/link`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teller_account_id: null })
  });
  await loadSavings();
}

export async function saveBalance(accountId) {
  const balance = parseFloat(document.getElementById(`sb-${accountId}`).value);
  if (isNaN(balance)) return alert('Enter a valid amount.');
  await fetch('/api/savings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_id: accountId, month: state.currentMonth, balance })
  });
  await loadSavings();
}

export async function deleteSavingsAccount(id) {
  if (!confirm('Delete this account and all its balance history?')) return;
  await fetch(`/api/savings-accounts/${id}`, { method: 'DELETE' });
  await loadSavings();
}
