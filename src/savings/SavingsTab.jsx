import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth, useHeroStats } from '../state/AppStateContext.jsx';
import { SavingsRow } from './SavingsRow.jsx';

export function SavingsTab({ active }) {
  const [currentMonth] = useCurrentMonth();
  const [, setHeroStats] = useHeroStats();
  const [accounts, setAccounts] = useState([]);
  const [tellerAccounts, setTellerAccounts] = useState([]);
  const [name, setName] = useState('');

  const load = async () => {
    const [savingsRes, tellerRes] = await Promise.all([
      apiFetch(`/api/savings?month=${currentMonth}`).then((r) => r.json()),
      apiFetch('/api/teller/balances').then((r) => r.json()),
    ]);
    setAccounts(savingsRes.data);
    setTellerAccounts(tellerRes.data || []);
    const hasBalance = savingsRes.data.some((a) => a.balance !== null);
    const totalBalance = hasBalance ? savingsRes.data.reduce((sum, a) => sum + (a.balance || 0), 0) : 0;
    setHeroStats((s) => ({ ...s, savingsTotal: totalBalance }));
  };

  useEffect(() => { if (active) load(); }, [active, currentMonth]);

  const addAccount = async () => {
    const trimmed = name.trim();
    if (!trimmed) { alert('Account name is required.'); return; }
    await apiFetch('/api/savings-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setName('');
    await load();
  };

  const saveBalance = async (id, value) => {
    const balance = parseFloat(value);
    if (isNaN(balance)) { alert('Enter a valid amount.'); return; }
    await apiFetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: id, month: currentMonth, balance }),
    });
    await load();
  };

  const linkAccount = async (id, tellerAccountId) => {
    if (!tellerAccountId) return;
    await apiFetch(`/api/savings-accounts/${id}/link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teller_account_id: tellerAccountId }),
    });
    await load();
  };

  const unlinkAccount = async (id) => {
    await apiFetch(`/api/savings-accounts/${id}/link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teller_account_id: null }),
    });
    await load();
  };

  const deleteAccount = async (id) => {
    if (!confirm('Delete this account and all its balance history?')) return;
    await apiFetch(`/api/savings-accounts/${id}`, { method: 'DELETE' });
    await load();
  };

  const hasBalance = accounts.some((a) => a.balance !== null);
  const hasPrev = accounts.some((a) => a.prev_balance !== null);
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalPrev = accounts.reduce((sum, a) => sum + (a.prev_balance || 0), 0);
  const totalDelta = hasBalance && hasPrev ? totalBalance - totalPrev : null;

  return (
    <>
      <div className="card">
        <h2>Add savings account</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Account name</label>
            <input type="text" placeholder="e.g. My savings account" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={addAccount}>Add account</button>
          </div>
        </div>
      </div>

      {!!accounts.length && (
        <div className="card">
          <h2>Balances this month</h2>
          <div>
            {accounts.map((a) => (
              <SavingsRow key={a.id} account={a} tellerAccounts={tellerAccounts} onSave={saveBalance} onLink={linkAccount} onUnlink={unlinkAccount} onDelete={deleteAccount} />
            ))}
            {hasBalance && (
              <div className="savings-row" style={{ borderTop: '2px solid rgba(0,0,0,0.1)', marginTop: 4, fontWeight: 500 }}>
                <div className="savings-row-name">Total</div>
                <div className="savings-balance-amt">${totalBalance.toFixed(2)}</div>
                <div className="savings-prev-text">Prev: {hasPrev ? `$${totalPrev.toFixed(2)}` : '—'}</div>
                <div><span className={totalDelta === null ? 'savings-delta-neutral' : totalDelta > 0 ? 'savings-delta-positive' : totalDelta < 0 ? 'savings-delta-negative' : 'savings-delta-neutral'}>
                  {totalDelta === null ? '—' : `${totalDelta > 0 ? '+' : ''}$${totalDelta.toFixed(2)}`}
                </span></div>
                <div></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
