import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useCurrentMonth, useFamilyMembers } from '../state/AppStateContext.jsx';

export function FamilyTab({ active }) {
  const [currentMonth] = useCurrentMonth();
  const [familyMembers, setFamilyMembers] = useFamilyMembers();
  const [net, setNet] = useState(null);
  const [remittances, setRemittances] = useState([]);
  const [editing, setEditing] = useState(false);
  const [names, setNames] = useState({});
  const [actuals, setActuals] = useState({});

  const load = async () => {
    const [membersRes, summaryRes] = await Promise.all([
      apiFetch('/api/family-members').then((r) => r.json()),
      apiFetch(`/api/summary?month=${currentMonth}`).then((r) => r.json()),
    ]);
    setFamilyMembers(membersRes.data);
    setNet(summaryRes.data.net);
    setActuals({});
    if (summaryRes.data.net > 0) {
      const remRes = await apiFetch(`/api/family-remittances?month=${currentMonth}`).then((r) => r.json());
      setRemittances(remRes.data);
    }
  };

  useEffect(() => { if (active) load(); }, [active, currentMonth]);

  if (net === null) {
    return <div className="card"><h2>Family remittance</h2><p style={{ color: '#999', fontSize: 14 }}>Loading…</p></div>;
  }

  if (net <= 0) {
    return <div className="card"><h2>Family remittance</h2><p style={{ color: '#999', fontSize: 14 }}>No positive net income this month — remittance calculator not available.</p></div>;
  }

  const total = net * 0.05;
  const amounts = [total * 0.28, total * 0.28, total * 0.44 / 3, total * 0.44 / 3, total * 0.44 / 3];
  const pcts = ['28%', '28%', '14.67%', '14.67%', '14.67%'];
  const names5 = familyMembers.length === 5 ? familyMembers.map((m) => m.name) : ['Person 1', 'Person 2', 'Person 3', 'Person 4', 'Person 5'];
  const ids = familyMembers.length === 5 ? familyMembers.map((m) => m.id) : [0, 0, 0, 0, 0];
  const remByMember = {};
  remittances.forEach((r) => { remByMember[r.member_id] = r; });

  const startEdit = () => {
    const initial = {};
    ids.forEach((id, i) => { initial[id] = names5[i]; });
    setNames(initial);
    setEditing(true);
  };

  const saveNames = async () => {
    await Promise.all(familyMembers.map((m) => {
      const val = (names[m.id] || '').trim();
      if (!val || val === m.name) return Promise.resolve();
      return apiFetch(`/api/family-members/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: val }),
      });
    }));
    setEditing(false);
    await load();
  };

  const saveRemittances = async () => {
    const saves = familyMembers.map((m) => {
      const val = actuals[m.id];
      if (val === undefined || val === '') return Promise.resolve();
      const amount = parseFloat(val) || 0;
      return apiFetch('/api/family-remittances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: m.id, month: currentMonth, amount }),
      });
    });
    await Promise.all(saves);
    await load();
  };

  return (
    <div className="card">
      <h2>Family remittance</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-sm" onClick={startEdit}>Edit names</button>
      </div>
      <div className="family-total">
        <span>5% of net (${net.toFixed(2)})</span>
        <span>${total.toFixed(2)}</span>
      </div>
      {!editing && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 140px', gap: 8, fontSize: 12, color: '#999', padding: '0 0 6px', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 2 }}>
            <span>Member</span><span style={{ textAlign: 'right' }}>Suggested</span><span style={{ textAlign: 'right' }}>Actual sent</span>
          </div>
          {names5.map((n, i) => {
            const existing = remByMember[ids[i]];
            const actualVal = actuals[ids[i]] !== undefined ? actuals[ids[i]] : (existing ? parseFloat(existing.amount).toFixed(2) : '');
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 140px', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span className="family-row-label">{n} <span style={{ fontSize: 11, color: '#999' }}>{pcts[i]}</span></span>
                <span className="family-row-amount" style={{ textAlign: 'right' }}>${amounts[i].toFixed(2)}</span>
                <input
                  type="number"
                  value={actualVal}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{ width: '100%', padding: '5px 8px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, textAlign: 'right', background: 'white', color: '#333' }}
                  onChange={(e) => setActuals((a) => ({ ...a, [ids[i]]: e.target.value }))}
                />
              </div>
            );
          })}
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '7px 20px' }} onClick={saveRemittances}>Save remittances</button>
          </div>
        </div>
      )}
      {editing && (
        <div>
          {names5.map((n, i) => (
            <div key={i} className="family-row">
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <input type="text" value={names[ids[i]] ?? n} placeholder="Name" onChange={(e) => setNames((s) => ({ ...s, [ids[i]]: e.target.value }))} />
              </div>
              <span className="family-row-amount" style={{ minWidth: 80, textAlign: 'right' }}>${amounts[i].toFixed(2)}</span>
            </div>
          ))}
          <div className="edit-actions">
            <button className="btn btn-primary" style={{ width: 'auto', padding: '7px 20px' }} onClick={saveNames}>Save</button>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
