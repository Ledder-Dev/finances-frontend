import { useState } from 'react';
import { TransactionForm } from './TransactionForm.jsx';
import { TransactionList } from './TransactionList.jsx';
import { RecurringForm } from './RecurringForm.jsx';
import { RecurringList } from './RecurringList.jsx';

export function TransactionsTab() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [recurringRefreshToken, setRecurringRefreshToken] = useState(0);

  return (
    <>
      <TransactionForm onSaved={() => setRefreshToken((t) => t + 1)} />
      <TransactionList refreshToken={refreshToken} />
      <RecurringForm
        onSaved={() => {
          setRecurringRefreshToken((t) => t + 1);
          setRefreshToken((t) => t + 1);
        }}
      />
      <RecurringList refreshToken={recurringRefreshToken} />
    </>
  );
}
