import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useCurrentMonth } from './state/AppStateContext.jsx';
import { apiFetch } from './api.js';
import { TabNav, TAB_IDS } from './components/TabNav.jsx';
import { PurchasesTab } from './products/PurchasesTab.jsx';
import { ProductList } from './products/ProductList.jsx';
import { TransactionsTab } from './transactions/TransactionsTab.jsx';
import { FamilyTab } from './family-bank/FamilyTab.jsx';
import { BankTab } from './family-bank/BankTab.jsx';
import { SavingsTab } from './savings/SavingsTab.jsx';
import { DebtsTab } from './debts/DebtsTab.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { HeroBanner } from './dashboard/HeroBanner.jsx';
import { SummaryGrid } from './dashboard/SummaryGrid.jsx';
import { AnalysisTab } from './analysis/AnalysisTab.jsx';
import { CompareTab } from './products/CompareTab.jsx';

export function Layout() {
  const { user, logout } = useAuth();
  const [currentMonth, setCurrentMonth] = useCurrentMonth();
  const [months, setMonths] = useState([currentMonth]);
  const [activeTab, setActiveTab] = useState('purchases');
  const [bankPendingCount, setBankPendingCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    apiFetch('/api/months')
      .then((res) => res.json())
      .then(({ data }) => {
        const list = data.length ? data : [currentMonth];
        if (!list.includes(currentMonth)) list.unshift(currentMonth);
        setMonths(list);
      });
  }, []);

  useEffect(() => {
    apiFetch('/api/teller/pending-count')
      .then((res) => res.json())
      .then(({ data }) => setBankPendingCount(data.count))
      .catch(() => {});
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
            <button className="settings-btn" title="Personalize" onClick={() => setSettingsOpen(true)}>⚙</button>
          </div>
        </div>
      </div>

      <HeroBanner />

      <div className="month-bar">
        <label style={{ fontSize: 13, color: '#666' }}>Month</label>
        <select value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <SummaryGrid />

      <TabNav activeTab={activeTab} onChange={setActiveTab} bankPendingCount={bankPendingCount} />

      {TAB_IDS.map((id) => (
        <div key={id} id={`tab-${id}`} className={`tab-section${activeTab === id ? ' active' : ''}`}>
          {id === 'purchases' && <PurchasesTab />}
          {id === 'products' && <ProductList active={activeTab === 'products'} />}
          {id === 'transactions' && <TransactionsTab />}
          {id === 'savings' && <><SavingsTab active={activeTab === 'savings'} /><DebtsTab active={activeTab === 'savings'} /></>}
          {id === 'family' && <FamilyTab active={activeTab === 'family'} />}
          {id === 'analysis' && <AnalysisTab active={activeTab === 'analysis'} />}
          {id === 'bank' && <BankTab active={activeTab === 'bank'} onPendingCountChange={setBankPendingCount} />}
          {id === 'compare' && <CompareTab active={activeTab === 'compare'} />}
        </div>
      ))}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
