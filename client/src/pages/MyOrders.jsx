import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderStatusBadge from '../components/order/OrderStatusBadge';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchOrders();
  }, [user]);

  async function fetchOrders() {
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

  return (
    <div className="min-h-screen bg-linen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-indigo-brand mb-6">My Orders</h1>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-warm">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-warm">
            <p className="mb-4">No orders yet.</p>
            <Link to="/catalog" className="bg-saffron-red text-white px-6 py-2 rounded hover:opacity-90">
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow text-sm">
              <thead className="bg-indigo-brand text-white">
                <tr>
                  <th className="text-left px-4 py-3">Order ID</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-indigo-brand">{order.orderId}</td>
                    <td className="px-4 py-3 text-slate-warm">
                      {formatDate(order.createdAt || order.date)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-brand">
                      {formatCurrency(order.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/my-orders/${order._id}`}
                        className="text-indigo-brand border border-indigo-brand px-3 py-1 rounded text-xs hover:bg-indigo-brand hover:text-white transition"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
