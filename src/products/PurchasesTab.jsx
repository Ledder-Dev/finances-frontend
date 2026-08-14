import { useRef, useState } from 'react';
import { PurchaseForm } from './PurchaseForm.jsx';
import { ReceiptForm } from '../receipts/ReceiptForm.jsx';
import { ReceiptList } from '../receipts/ReceiptList.jsx';

export function PurchasesTab() {
  const [mode, setMode] = useState('purchase');
  const [refreshToken, setRefreshToken] = useState(0);
  const [scanning, setScanning] = useState(false);
  const scanInputRef = useRef(null);

  const triggerScan = () => {
    setMode('receipt');
    scanInputRef.current?.click();
  };

  return (
    <div>
      <div className="mode-toggle">
        <button className={`mode-btn${mode === 'purchase' ? ' active' : ''}`} onClick={() => setMode('purchase')}>Add Purchase</button>
        <button className={`mode-btn${mode === 'receipt' ? ' active' : ''}`} onClick={() => setMode('receipt')}>Add Receipt</button>
        <button className="mode-btn" onClick={triggerScan} disabled={scanning}>{scanning ? 'Scanning...' : 'Scan receipt'}</button>
      </div>
      <div style={{ display: mode === 'purchase' ? 'block' : 'none' }}>
        <PurchaseForm />
      </div>
      <div style={{ display: mode === 'receipt' ? 'block' : 'none' }}>
        <ReceiptForm scanInputRef={scanInputRef} setScanning={setScanning} onSaved={() => setRefreshToken((t) => t + 1)} />
      </div>
      <ReceiptList refreshToken={refreshToken} />
    </div>
  );
}
