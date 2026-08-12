import { useAuth } from './AuthContext.jsx';

export default function App() {
  const { status, user } = useAuth();
  return <p>React scaffold OK — auth status: {status} {user ? `(${user.email})` : ''} — layout real llega en task 022.</p>;
}
