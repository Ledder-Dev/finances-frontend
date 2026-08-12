import { useAuth } from './AuthContext.jsx';
import { useCurrentMonth } from './state/AppStateContext.jsx';

export default function App() {
  const { status, user } = useAuth();
  const [currentMonth] = useCurrentMonth();
  return <p>React scaffold OK — auth: {status} {user ? `(${user.email})` : ''} — mes: {currentMonth} — layout real llega en task 022.</p>;
}
