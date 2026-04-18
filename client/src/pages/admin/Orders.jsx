import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ORDER_STATUSES = ['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);
}

function StatusBadge({ status }) {
  const colors = {
    Confirmed: 'bg-blue-100 text-blue-700',
    Processing: 'bg-yellow-100 text-yellow-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-gray-100 text-slate-warm',
    Refunded: 'bg-red-100 text-saffron-red',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '', customer: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const fetchOrders = useCallback(() => {
    setLoading(true); setError(null);
    const params = { page, limit: 20 };
    if (filters.status && filters.status !== 'All') params.status = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.customer) params.customer = filters.customer;

    api.get('/api/admin/orders', { params })
      .then((res) => {
        const d = res.data.data ?? res.data;
        setOrders(d.orders ?? []);
        const total = d.pagination?.total ?? d.orders?.length ?? 0;
        setTotalPages(Math.max(1, Math.ceil(total / 20)));
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? 'Failed to load orders.'))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleStatusChange(orderId, newStatus) {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to update status.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  async function handleRefund(orderId) {
    if (!window.confirm('Initiate refund for this order?')) return;
    setActionLoading((prev) => ({ ...prev, [orderId + '_refund']: true }));
    try {
      await api.post(`/api/admin/orders/${orderId}/refund`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Failed to initiate refund.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId + '_refund']: false }));
    }
  }

  return (
    <div className="min-h-screen bg-linen">
      <header className="bg-indigo-brand text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold tracking-wide">Muzab Admin - Orders</h1>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3">
          <select value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand">
            {ORDER_STATUSES.map((s) => <option key={s} value={s === 'All' ? '' : s}>{s}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand" />
          <input type="date" value={filters.dateTo} onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand" />
          <input type="text" placeholder="Search by customer..." value={filters.customer} onChange={(e) => { setFilters((f) => ({ ...f, customer: e.target.value })); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand flex-1 min-w-[200px]" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-saffron-red rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-warm text-sm">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-slate-warm">
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-brand">{order.orderId}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{order.userId?.name ?? 'Guest'}</p>
                        <p className="text-xs text-slate-warm">{order.userId?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-warm text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{formatINR(order.grandTotal)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={actionLoading[order._id]}
                            className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-brand disabled:opacity-50"
                          >
                            {ORDER_STATUSES.filter((s) => s !== 'All').map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {order.paymentStatus === 'paid' && order.paymentMethod === 'razorpay' && (
                            <button
                              onClick={() => handleRefund(order._id)}
                              disabled={actionLoading[order._id + '_refund']}
                              className="px-2 py-1 text-xs rounded-md bg-red-50 text-saffron-red hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading[order._id + '_refund'] ? 'Refunding...' : 'Refund'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-indigo-brand text-indigo-brand text-sm disabled:opacity-40 hover:bg-indigo-brand hover:text-white transition-colors">
              Prev
            </button>
            <span className="text-sm text-slate-warm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-indigo-brand text-indigo-brand text-sm disabled:opacity-40 hover:bg-indigo-brand hover:text-white transition-colors">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
