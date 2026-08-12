import { useState } from 'react';
import { TransactionForm } from './TransactionForm.jsx';
import { TransactionList } from './TransactionList.jsx';

export function TransactionsTab() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <>
      <TransactionForm onSaved={() => setRefreshToken((t) => t + 1)} />
      <TransactionList refreshToken={refreshToken} />
    </>
  );
}
