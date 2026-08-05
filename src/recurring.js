import { state, txDefaultCategories } from './state.js';
import { loadTransactionCategories, refreshAll } from './core.js';

export async function loadRecurringTransactions() {
  const res = await fetch('/api/recurring-transactions');
  const { data } = await res.json();
  const card = document.getElementById('recurringListCard');
  const list = document.getElementById('recurringList');
  if (!data.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  list.innerHTML = '';
  data.forEach(r => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-name">${r.description || '—'}<span class="badge">${r.category}</span></div>
          <div class="list-item-meta">Added automatically every month</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-amount ${r.type}">${r.type === 'income' ? '+' : '-'}$${parseFloat(r.amount).toFixed(2)}</div>
        </div>
        <button class="btn btn-sm" onclick="toggleEditRecurring(${r.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecurringTransaction(${r.id})">Remove from fixed</button>
      </div>
      <div class="edit-form" id="edit-rec-${r.id}">
        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <select id="erec-type-${r.id}">
              <option value="expense"${r.type === 'expense' ? ' selected' : ''}>Expense</option>
              <option value="income"${r.type === 'income' ? ' selected' : ''}>Income</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="text" id="erec-cat-${r.id}" list="txCategoryList" value="${r.category}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="erec-desc-${r.id}" value="${r.description || ''}">
          </div>
          <div class="form-group">
            <label>Amount ($)</label>
            <input type="number" id="erec-amt-${r.id}" value="${parseFloat(r.amount)}" step="0.01" min="0.01">
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn btn-primary" style="width:auto;padding:7px 20px;" onclick="saveRecurringTransaction(${r.id})">Save</button>
          <button class="btn" onclick="toggleEditRecurring(${r.id})">Cancel</button>
        </div>
      </div>
    `;
    list.appendChild(wrapper);
  });
}

export function toggleEditRecurring(id) {
  document.getElementById(`edit-rec-${id}`).classList.toggle('visible');
}

export async function addRecurringTransaction() {
  const type = document.getElementById('recType').value;
  const category = document.getElementById('recCategory').value.trim();
  const description = document.getElementById('recDesc').value.trim();
  const amount = parseFloat(document.getElementById('recAmount').value);
  if (!category || !amount) return alert('Category and amount are required.');
  await fetch('/api/recurring-transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, category, description, amount })
  });
  document.getElementById('recCategory').value = '';
  document.getElementById('recDesc').value = '';
  document.getElementById('recAmount').value = '';
  await loadTransactionCategories();
  await loadRecurringTransactions();
  await refreshAll();
}

export async function saveRecurringTransaction(id) {
  const type = document.getElementById(`erec-type-${id}`).value;
  const category = document.getElementById(`erec-cat-${id}`).value.trim();
  const description = document.getElementById(`erec-desc-${id}`).value.trim();
  const amount = parseFloat(document.getElementById(`erec-amt-${id}`).value);
  if (!category || !amount) return alert('Category and amount are required.');
  await fetch(`/api/recurring-transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, category, description, amount })
  });
  await loadTransactionCategories();
  await loadRecurringTransactions();
}

export async function deleteRecurringTransaction(id) {
  if (!confirm('Stop adding this automatically every month? Already-added transactions are kept.')) return;
  await fetch(`/api/recurring-transactions/${id}`, { method: 'DELETE' });
  await loadRecurringTransactions();
}

export function updateRecCategories() {
  const type = document.getElementById('recType').value;
  const all = [...new Set([...txDefaultCategories[type], ...(state.dbTxCategories[type] || [])])];
  const list = document.getElementById('txCategoryList');
  if (list) list.innerHTML = all.map(c => `<option value="${c}">`).join('');
}
