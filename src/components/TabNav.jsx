const TABS = [
  { id: 'purchases', label: 'Purchases' },
  { id: 'transactions', label: 'Income & Expenses' },
  { id: 'products', label: 'Products' },
  { id: 'compare', label: 'Compare' },
  { id: 'savings', label: 'Savings' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'family', label: 'Family' },
  { id: 'bank', label: 'Bank Sync' },
];

export function TabNav({ activeTab, onChange }) {
  return (
    <div className="tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.id === 'bank' && <span id="bankBadge" style={{ display: 'none' }} />}
        </button>
      ))}
    </div>
  );
}

export const TAB_IDS = TABS.map((tab) => tab.id);
