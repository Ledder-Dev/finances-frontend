import { useAuth } from './AuthContext.jsx';
import { AuthGate } from './components/AuthGate.jsx';
import { Layout } from './Layout.jsx';

export default function App() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'anon') return <AuthGate />;
  return <Layout />;
}
