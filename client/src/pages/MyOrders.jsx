import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderStatusBadge from '../components/order/OrderStatusBadge';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OrderTable({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-slate-warm">
        <p className="mb-4">No orders found.</p>
        <Link to="/catalog" className="bg-maroon text-white px-6 py-2 rounded-xl hover:bg-red-900 transition font-semibold text-sm">
          Browse Catalog
        </Link>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-xl shadow-sm text-sm">
        <thead className="bg-maroon text-white">
          <tr>
            <th className="text-left px-4 py-3 rounded-tl-xl">Order ID</th>
            <th className="text-left px-4 py-3">Date</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3">Total</th>
            <th className="px-4 py-3 rounded-tr-xl" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-indigo-brand">{order.orderId}</td>
              <td className="px-4 py-3 text-slate-warm">{formatDate(order.date || order.createdAt)}</td>
              <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
              <td className="px-4 py-3 text-right font-semibold text-indigo-brand">{formatCurrency(order.grandTotal)}</td>
              <td className="px-4 py-3 text-right">
                {order.confirmationToken ? (
                  <Link
                    to={`/order-confirmation/${order.confirmationToken}`}
                    className="text-maroon border border-maroon px-3 py-1 rounded-lg text-xs hover:bg-maroon hover:text-white transition"
                  >
                    View
                  </Link>
                ) : (
                  <Link
                    to={`/my-orders/${order._id}`}
                    className="text-indigo-brand border border-indigo-brand px-3 py-1 rounded-lg text-xs hover:bg-indigo-brand hover:text-white transition"
                  >
                    View Details
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MyOrders() {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg] = useState(location.state?.successMessage || '');

  // Guest lookup state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');
  const [lookupDone, setLookupDone] = useState(false);

  // Auto-load for authenticated users
  useEffect(() => {
    if (user) fetchAuthOrders();
  }, [user]);

  async function fetchAuthOrders() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/orders');
      setOrders(res.data.orders ?? res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLookup(e) {
    e.preventDefault();
    if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setGuestEmailError('Enter a valid email address');
      return;
    }
    setGuestEmailError('');
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/orders/lookup?email=${encodeURIComponent(guestEmail.trim())}`);
      setOrders(res.data.orders ?? []);
      setLookupDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to look up orders.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-indigo-brand mb-2">Order History</h1>
        <p className="text-sm text-slate-warm mb-6">
          {user ? `Showing orders for ${user.name}` : 'Enter your email to find your orders.'}
        </p>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Guest email lookup form */}
        {!user && !lookupDone && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-indigo-brand mb-4">Find Your Orders</h2>
            <form onSubmit={handleGuestLookup} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => { setGuestEmail(e.target.value); setGuestEmailError(''); }}
                  placeholder="Enter the email used at checkout"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-maroon transition ${guestEmailError ? 'border-red-400' : 'border-gray-300'}`}
                  autoComplete="email"
                />
                {guestEmailError && <p className="mt-1 text-xs text-red-500">{guestEmailError}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-maroon text-white rounded-lg font-semibold text-sm hover:bg-red-900 transition disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Find Orders'}
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-warm">
              Have an account?{' '}
              <Link to="/login" className="text-maroon font-medium hover:underline">Sign in</Link>{' '}
              to see your full order history.
            </p>
          </div>
        )}

        {/* Guest: show new search button after lookup */}
        {!user && lookupDone && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => { setLookupDone(false); setOrders([]); setGuestEmail(''); }}
              className="text-sm text-maroon hover:underline font-medium"
            >
              ← Search with a different email
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-slate-warm">Loading orders...</div>
        )}

        {!loading && (user || lookupDone) && (
          <OrderTable orders={orders} />
        )}
      </div>
    </div>
  );
}
