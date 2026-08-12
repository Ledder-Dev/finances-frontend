import { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useCurrentMonth, useProducts } from './state/AppStateContext.jsx';
import { CategorySelect } from './components/CategorySelect.jsx';
import { UnitSelect } from './components/UnitSelect.jsx';
import { ProductTypeSelect } from './components/ProductTypeSelect.jsx';

export default function App() {
  const { status, user } = useAuth();
  const [currentMonth] = useCurrentMonth();
  const [allProducts] = useProducts();
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [unit, setUnit] = useState('U');

  return (
    <div>
      <p>React scaffold OK — auth: {status} {user ? `(${user.email})` : ''} — mes: {currentMonth} — layout real llega en task 022.</p>
      <CategorySelect id="smoke-cat" value={category} onChange={setCategory} />
      <ProductTypeSelect id="smoke-type" products={allProducts} category={category} value={type} onChange={setType} />
      <UnitSelect id="smoke-unit" value={unit} onChange={setUnit} />
    </div>
  );
}
