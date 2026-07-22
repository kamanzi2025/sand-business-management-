import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-lg font-bold text-slate-900">Sand Supply</h1>
          <p className="text-sm text-slate-500">Enter the password to continue</p>
        </div>

        {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
