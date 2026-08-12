import { useState } from 'react';
import { useTxCategories } from '../state/AppStateContext.jsx';
import { txDefaultCategories } from '../state.js';

function categoriesFor(dbTxCategories, type) {
  return [...new Set([...dbTxCategories[type], ...txDefaultCategories[type]])];
}

export function TellerReviewCard({ tx, onAdd, onDismiss }) {
  const [dbTxCategories] = useTxCategories();
  const [type, setType] = useState(tx.type);
  const [category, setCategory] = useState(categoriesFor(dbTxCategories, tx.type)[0] || '');

  const changeType = (newType) => {
    setType(newType);
    setCategory(categoriesFor(dbTxCategories, newType)[0] || '');
  };

  const categories = categoriesFor(dbTxCategories, type);

  return (
    <div className="card" style={{ borderLeft: `4px solid ${tx.type === 'expense' ? '#ef4444' : '#22c55e'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{tx.description}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{tx.institution} · {tx.account_name} · {tx.date}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: tx.type === 'expense' ? '#ef4444' : '#22c55e', whiteSpace: 'nowrap', marginLeft: 12 }}>
          {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={type} onChange={(e) => changeType(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="text"
          list={`teller-cat-list-${tx.teller_id}`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, flex: 1, minWidth: 120 }}
        />
        <datalist id={`teller-cat-list-${tx.teller_id}`}>
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 16px', fontSize: 13 }} onClick={() => onAdd(type, category)}>Add</button>
        <button className="btn" style={{ width: 'auto', padding: '6px 16px', fontSize: 13, background: '#f5f5f5', color: '#666' }} onClick={onDismiss}>Skip</button>
      </div>
    </div>
  );
}
