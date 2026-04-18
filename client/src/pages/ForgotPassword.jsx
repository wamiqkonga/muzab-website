import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-indigo-brand mb-1">Reset your password</h1>
        <p className="text-slate-warm text-sm mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        {submitted ? (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-4 mb-4">
            If that email is registered, you'll receive a reset link shortly.
          </div>
        ) : (
          <>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-saffron-red hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center text-sm text-slate-warm">
          <Link to="/login" className="text-indigo-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
