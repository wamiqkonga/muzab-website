import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export default function CartSummary({ onClose }) {
  const { items, subtotal, gst, grandTotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-warm mb-3">Your cart is empty.</p>
        <Link
          to="/catalog"
          onClick={onClose}
          className="inline-block bg-saffron-red text-white px-5 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  function handleCheckout() {
    if (onClose) onClose();
    navigate('/checkout');
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-slate-warm">
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-warm">
          <span>GST (18%)</span>
          <span>{formatINR(gst)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-indigo-brand border-t border-gray-200 pt-2 mt-2">
          <span>Grand Total</span>
          <span>{formatINR(grandTotal)}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        className="w-full flex items-center justify-center h-12 bg-saffron-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
