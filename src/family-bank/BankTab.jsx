import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { usePlaidSyncData } from '../state/AppStateContext.jsx';
import { TellerReviewCard } from './TellerReviewCard.jsx';

const SUBTYPE_LABEL = { checking: 'Checking', savings: 'Savings', credit_card: 'Credit Card' };
const isCredit = (s) => s === 'credit_card';

export function BankTab({ active, onPendingCountChange }) {
  const [balances, setBalances] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [plaidSyncData, setPlaidSyncData] = usePlaidSyncData();
  const [pendingMessage, setPendingMessage] = useState({ text: '', color: '#666' });

  const loadEnrollments = () => apiFetch('/api/teller/enrollments').then((r) => r.json()).then(({ data }) => setEnrollments(data || []));
  const loadBalances = () => apiFetch('/api/teller/balances').then((r) => r.json()).then(({ data }) => setBalances(data || []));

  const loadPending = async () => {
    try {
      const { data } = await apiFetch('/api/teller/pending').then((r) => r.json());
      setPlaidSyncData(data);
      onPendingCountChange(data.length);
      setPendingMessage(data.length
        ? { text: `${data.length} transaction(s) waiting for review.`, color: '#666' }
        : { text: 'All caught up — no transactions waiting for review.', color: '#22c55e' });
    } catch {
      setPendingMessage({ text: 'Network error. Check server logs.', color: '#ef4444' });
    }
  };

  useEffect(() => {
    if (active) { loadEnrollments(); loadBalances(); loadPending(); }
  }, [active]);

  const openPlaidLink = async () => {
    const { link_token } = await apiFetch('/api/plaid/create-link-token', { method: 'POST' }).then((r) => r.json());
    if (!link_token) { alert('Could not initialize bank connection. Check server logs.'); return; }
    const handler = Plaid.create({
      token: link_token,
      onSuccess: async (public_token, metadata) => {
        await apiFetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token, institution_name: metadata.institution.name }),
        });
        await loadEnrollments();
      },
      onExit: (err) => { if (err) console.error('Plaid Link exit:', err); },
    });
    handler.open();
  };

  const disconnect = async (id, name) => {
    if (!confirm(`Disconnect ${name}? Already-added transactions are kept.`)) return;
    await apiFetch(`/api/teller/enrollments/${id}`, { method: 'DELETE' });
    await loadEnrollments();
  };

  const triggerManualSync = () => {
    setPendingMessage({ text: 'Checking banks — this takes about 30 seconds...', color: '#666' });
    apiFetch('/api/teller/sync-now', { method: 'POST' });
    setTimeout(() => { loadEnrollments(); loadBalances(); loadPending(); }, 30000);
  };

  const removeFromPending = (i) => {
    const next = plaidSyncData.filter((_, idx) => idx !== i);
    setPlaidSyncData(next);
    onPendingCountChange(next.length);
  };

  const addTx = async (i, type, category) => {
    const tx = plaidSyncData[i];
    await apiFetch('/api/teller/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teller_id: tx.teller_id, type, category, description: tx.description, amount: tx.amount, month: tx.month }),
    });
    removeFromPending(i);
  };

  const dismissTx = async (i) => {
    const tx = plaidSyncData[i];
    await apiFetch('/api/teller/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teller_id: tx.teller_id }),
    });
    removeFromPending(i);
  };

  return (
    <>
      {!!balances.length && (
        <div className="card">
          <h2>Account balances</h2>
          <div>
            {balances.map((b) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(100,80,40,0.08)' }}>
                <div>
                  <div className="bank-account-name">{b.account_name}</div>
                  <div className="bank-account-sub">{b.institution} · {SUBTYPE_LABEL[b.account_subtype] || b.account_subtype}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isCredit(b.account_subtype) ? '#2b4980' : '#145a30' }}>
                    ${parseFloat(b.available).toFixed(2)}
                  </div>
                  <div className="bank-account-sub">{isCredit(b.account_subtype) ? 'Available credit' : 'Available balance'}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#ccc', fontSize: 11, marginTop: 12 }}>Updated every 24 hours</p>
        </div>
      )}

      <div className="card">
        <h2>Connected accounts</h2>
        {!enrollments.length ? (
          <p style={{ color: '#999', fontSize: 14 }}>No accounts connected yet.</p>
        ) : (
          enrollments.map((e) => {
            const loginRequired = e.sync_error?.startsWith('Login required');
            const bg = loginRequired ? '#fef2f2' : '#fffbeb';
            const border = loginRequired ? '#fecaca' : '#fde68a';
            const color = loginRequired ? '#b91c1c' : '#92400e';
            return (
              <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(100,80,40,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong className="bank-account-name">{e.institution_name}</strong>
                    <span className="bank-account-sub" style={{ marginLeft: 8 }}>Connected {e.created_at.split('T')[0]}</span>
                    {e.last_synced_at && (
                      <span className="bank-account-sub" style={{ marginLeft: 8 }}>
                        Last sync: {new Date(e.last_synced_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <button onClick={() => disconnect(e.id, e.institution_name)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '4px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer' }}>Disconnect</button>
                </div>
                {e.sync_error && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 6, fontSize: 13, color }}>
                    {e.sync_error}
                  </div>
                )}
              </div>
            );
          })
        )}
        <button className="btn btn-primary" style={{ width: 'auto', marginTop: 12 }} onClick={openPlaidLink}>+ Connect account</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Transactions to review</h2>
          <button className="btn" style={{ width: 'auto', padding: '8px 20px', background: '#f5f5f5', color: '#444', fontSize: 13 }} onClick={triggerManualSync}>Check now</button>
        </div>
        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>New transactions are fetched automatically every 24 hours. Review and add or skip each one.</p>
        {pendingMessage.text && <p style={{ color: pendingMessage.color, fontSize: 13, marginTop: 8 }}>{pendingMessage.text}</p>}
      </div>

      {plaidSyncData.map((tx, i) => (
        <TellerReviewCard key={tx.teller_id} tx={tx} onAdd={(type, category) => addTx(i, type, category)} onDismiss={() => dismissTx(i)} />
      ))}
    </>
  );
}
