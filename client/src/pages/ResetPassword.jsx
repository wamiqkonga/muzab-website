import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [success, setSuccess] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password: form.password });
      setSuccess(true);
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.error?.code;
      if (status === 400 && (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || code === 'NOT_FOUND')) {
        setTokenExpired(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (tokenExpired) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-indigo-brand mb-3">Link expired</h1>
          <p className="text-slate-warm text-sm mb-6">
            This reset link has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-saffron-red hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-indigo-brand mb-3">Password reset</h1>
          <p className="text-slate-warm text-sm mb-6">
            Password reset successfully. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="inline-block bg-saffron-red hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-indigo-brand mb-1">Set new password</h1>
        <p className="text-slate-warm text-sm mb-6">
          Min 8 chars, 1 uppercase, 1 lowercase, 1 digit.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-indigo-brand mb-1">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-indigo-brand mb-1">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
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
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-warm">
          <Link to="/login" className="text-indigo-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
