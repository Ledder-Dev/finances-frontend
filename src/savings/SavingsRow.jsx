import { useEffect, useState } from 'react';

function deltaClass(delta) {
  if (delta === null) return 'savings-delta-neutral';
  if (delta > 0) return 'savings-delta-positive';
  if (delta < 0) return 'savings-delta-negative';
  return 'savings-delta-neutral';
}

function deltaText(delta) {
  return delta === null ? '—' : `${delta > 0 ? '+' : ''}$${delta.toFixed(2)}`;
}

export function SavingsRow({ account, tellerAccounts, onSave, onLink, onUnlink, onDelete }) {
  const [balanceInput, setBalanceInput] = useState(account.balance !== null ? account.balance : '');

  useEffect(() => {
    setBalanceInput(account.balance !== null ? account.balance : '');
  }, [account.id, account.balance]);

  const linked = tellerAccounts && account.plaid_account_id
    ? tellerAccounts.find((t) => t.account_id === account.plaid_account_id)
    : null;

  return (
    <div className="savings-row">
      <div className="savings-row-name">{account.name}</div>
      {linked ? (
        <div className="savings-balance-amt">
          {account.balance !== null ? `$${account.balance.toFixed(2)}` : '—'}
          <div className="savings-linked-name">Auto — {linked.account_name}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="number" value={balanceInput} placeholder="0.00" step="0.01" style={{ margin: 0 }} onChange={(e) => setBalanceInput(e.target.value)} />
          </div>
          {!!tellerAccounts?.length && (
            <select
              style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, color: '#666' }}
              value=""
              onChange={(e) => onLink(account.id, e.target.value)}
            >
              <option value="">Link to bank account...</option>
              {tellerAccounts.map((t) => <option key={t.account_id} value={t.account_id}>{t.institution} — {t.account_name}</option>)}
            </select>
          )}
        </div>
      )}
      <div className="savings-prev-text">Prev: {account.prev_balance !== null ? `$${account.prev_balance.toFixed(2)}` : '—'}</div>
      <div><span className={deltaClass(account.delta)}>{deltaText(account.delta)}</span></div>
      <div style={{ display: 'flex', gap: 6 }}>
        {linked ? (
          <button className="btn btn-sm" onClick={() => onUnlink(account.id)}>Unlink</button>
        ) : (
          <button className="btn btn-sm" onClick={() => onSave(account.id, balanceInput)}>Save</button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(account.id)}>Delete</button>
      </div>
    </div>
  );
}
