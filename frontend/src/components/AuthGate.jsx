import { useAuth } from '../context/AuthContext';
import Login from './Login';

export default function AuthGate({ children }) {
  const { authenticated } = useAuth();

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!authenticated) return <Login />;

  return children;
}
