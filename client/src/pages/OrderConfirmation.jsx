import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function OrderConfirmation() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid confirmation link.'); setLoading(false); return; }
    api.get(`/api/orders/confirmation/${token}`)
      .then((res) => setOrder(res.data.order))
      .catch(() => setError('Order not found. The link may be expired or invalid.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-maroon border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-linen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-5xl">😕</p>
        <p className="text-lg font-semibold text-indigo-brand">{error || 'Order not found.'}</p>
        <Link to="/catalog" className="bg-maroon text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-900 transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-indigo-brand mb-2">Order Confirmed!</h1>
          <p className="text-slate-warm text-sm mb-1">
            Thank you for your order. We've received it and will process it shortly.
          </p>
          {order.guestEmail && (
            <p className="text-slate-warm text-sm">
              A confirmation has been sent to <span className="font-semibold text-indigo-brand">{order.guestEmail}</span>
            </p>
          )}
          <div className="mt-4 inline-block bg-linen rounded-lg px-4 py-2">
            <p className="text-xs text-slate-warm uppercase tracking-wide">Order ID</p>
            <p className="text-lg font-bold text-maroon">{order.orderId}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-indigo-brand">Items Ordered</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  {item.variantLabel && <p className="text-xs text-slate-warm">{item.variantLabel}</p>}
                  <p className="text-xs text-slate-warm">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-indigo-brand flex-shrink-0">{formatCurrency(item.lineTotal)}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 space-y-1.5 bg-linen border-t border-gray-100">
            <div className="flex justify-between text-sm text-slate-warm">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-warm">
              <span>Shipping</span><span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-warm">
              <span>GST (18%)</span><span>{formatCurrency(order.gst)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-indigo-brand border-t border-gray-200 pt-2 mt-1">
              <span>Grand Total</span><span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-indigo-brand mb-3 text-sm">Delivering To</h2>
            <address className="not-italic text-sm text-gray-700 leading-relaxed space-y-0.5">
              <p className="font-semibold">{order.deliveryAddress.name}</p>
              <p>{order.deliveryAddress.line1}</p>
              {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pinCode}</p>
              <p className="mt-1 text-slate-warm">📞 {order.deliveryAddress.phone}</p>
            </address>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-indigo-brand mb-3 text-sm">Payment</h2>
            <p className="text-sm text-gray-700">
              Method: <span className="font-semibold">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </p>
            <p className="text-sm text-gray-700 capitalize mt-1">
              Status: <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Date: <span className="font-semibold">{formatDate(order.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/catalog"
            className="flex-1 text-center py-3 rounded-xl border-2 border-maroon text-maroon font-semibold text-sm hover:bg-maroon hover:text-white transition"
          >
            Continue Shopping
          </Link>
          <Link
            to="/my-orders"
            className="flex-1 text-center py-3 rounded-xl bg-maroon text-white font-semibold text-sm hover:bg-red-900 transition"
          >
            View My Orders
          </Link>
        </div>

        <p className="text-center text-xs text-slate-warm mt-6">
          Questions? Call us at{' '}
          <a href="tel:+919086660267" className="text-maroon font-semibold hover:underline">+91-9086660267</a>
        </p>
      </div>
    </div>
  );
}
