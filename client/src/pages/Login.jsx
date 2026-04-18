import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch {
      // Generic message — never reveal which field was wrong (Req 3.3)
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Header */}
        <h1 className="text-2xl font-bold text-indigo-brand mb-1">Welcome back</h1>
        <p className="text-slate-warm text-sm mb-6">Sign in to your Muzab account</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-indigo-brand mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-indigo-brand mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-saffron-red hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-warm">
          <Link to="/forgot-password" className="text-indigo-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-slate-warm">
          Don't have an account?{' '}
          <Link to="/register" className="text-saffron-red font-medium hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
