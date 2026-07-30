import { state } from './state.js';
import { updateHeroNetSavings } from './hero.js';

export async function loadDebts() {
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

  state.heroReceivableTotal = receivables.filter(d => !d.settled).reduce((s, d) => s + parseFloat(d.amount), 0);
  state.heroPayableTotal = payables.filter(d => !d.settled).reduce((s, d) => s + parseFloat(d.amount), 0);
  updateHeroNetSavings();
}

export async function addDebt() {
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

export async function settleDebt(id) {
  await fetch(`/api/debts/${id}/settle`, { method: 'PUT' });
  await loadDebts();
}

export async function deleteDebt(id) {
  if (!confirm('Delete this entry?')) return;
  await fetch(`/api/debts/${id}`, { method: 'DELETE' });
  await loadDebts();
}
