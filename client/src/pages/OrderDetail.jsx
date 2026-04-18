import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OrderStatusBadge from '../components/order/OrderStatusBadge';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const SUPPORT_CONTACT = '+91-9086660267';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchOrder();
  }, [user, id]);

  async function fetchOrder() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data.order ?? res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      await api.post(`/api/orders/${id}/cancel`);
      setSuccessMsg('Order cancelled successfully.');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center text-slate-warm">
        Loading order...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-linen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Link to="/my-orders" className="text-indigo-brand underline">Back to My Orders</Link>
      </div>
    );
  }

  if (!order) return null;

  const isCancellable = ['Confirmed', 'Processing'].includes(order.status);
  const showSupportContact = ['Shipped', 'Delivered', 'Cancelled', 'Refunded'].includes(order.status);

  return (
    <div className="min-h-screen bg-linen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/my-orders" className="text-sm text-indigo-brand hover:underline mb-4 inline-block">
          ← Back to My Orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-brand">{order.orderId}</h1>
            <p className="text-sm text-slate-warm">{formatDate(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

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

        {/* Items */}
        <section className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-indigo-brand mb-3">Items</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-warm border-b">
              <tr>
                <th className="pb-2">Product</th>
                <th className="pb-2">Variant</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="py-3 text-slate-warm">{item.variantLabel || '—'}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Delivery Address */}
        <section className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-indigo-brand mb-2">Delivery Address</h2>
          <address className="not-italic text-sm text-gray-700 leading-relaxed">
            <p className="font-medium">{order.deliveryAddress.name}</p>
            <p>{order.deliveryAddress.line1}</p>
            {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
            <p>
              {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
              {order.deliveryAddress.pinCode}
            </p>
            <p>Phone: {order.deliveryAddress.phone}</p>
          </address>
        </section>

        {/* Payment */}
        <section className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-indigo-brand mb-2">Payment</h2>
          <p className="text-sm text-gray-700">
            Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
          </p>
          <p className="text-sm text-gray-700 capitalize">Status: {order.paymentStatus}</p>
        </section>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <section className="bg-white rounded-lg shadow p-5 mb-4">
            <h2 className="font-semibold text-indigo-brand mb-3">Status History</h2>
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {order.statusHistory.map((entry, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute -left-1.5 w-3 h-3 bg-indigo-brand rounded-full border-2 border-white" />
                  <p className="font-medium text-gray-800">{entry.status}</p>
                  <p className="text-xs text-slate-warm">{formatDate(entry.changedAt)}</p>
                  {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Pricing Summary */}
        <section className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-indigo-brand mb-3">Pricing Summary</h2>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{formatCurrency(order.gst)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-indigo-brand border-t pt-2 mt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-2">
          {isCancellable && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-5 py-2 bg-saffron-red text-white rounded hover:opacity-90 transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          {showSupportContact && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 w-full">
              Need help? Contact us at{' '}
              <a href={`tel:${SUPPORT_CONTACT}`} className="font-semibold underline">
                {SUPPORT_CONTACT}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
