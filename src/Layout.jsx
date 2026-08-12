import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useCurrentMonth } from './state/AppStateContext.jsx';
import { apiFetch } from './api.js';
import { TabNav, TAB_IDS } from './components/TabNav.jsx';
import { PurchaseForm } from './products/PurchaseForm.jsx';
import { ProductList } from './products/ProductList.jsx';
import { TransactionsTab } from './transactions/TransactionsTab.jsx';

export function Layout() {
  const { user, logout } = useAuth();
  const [currentMonth, setCurrentMonth] = useCurrentMonth();
  const [months, setMonths] = useState([currentMonth]);
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    apiFetch('/api/months')
      .then((res) => res.json())
      .then(({ data }) => {
        const list = data.length ? data : [currentMonth];
        if (!list.includes(currentMonth)) list.unshift(currentMonth);
        setMonths(list);
      });
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="title">Finance Tracker</h1>
            <p className="subtitle">Purchases · Income · Expenses{user ? ` — ${user.email}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="settings-btn" onClick={logout} title="Log out">⎋</button>
            <button className="settings-btn" title="Personalize">⚙</button>
          </div>
        </div>
      </div>

      <div className="month-bar">
        <label style={{ fontSize: 13, color: '#666' }}>Month</label>
        <select value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {TAB_IDS.map((id) => (
        <div key={id} id={`tab-${id}`} className={`tab-section${activeTab === id ? ' active' : ''}`}>
          {id === 'purchases' && <PurchaseForm />}
          {id === 'products' && <ProductList active={activeTab === 'products'} />}
          {id === 'transactions' && <TransactionsTab />}
        </div>
      ))}
    </div>
  );
}
