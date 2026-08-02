import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import api from '../services/api';

export default function Cart() {
  const { items, setCart } = useCart();
  const hasOutOfStock = items.some((item) => item.outOfStock);

  // Re-sync from server when visiting the cart page directly
  // (CartContext hydrates on app mount, but this ensures fresh data after
  //  navigating here from an external link or after a long session)
  useEffect(() => {
    api.get('/api/cart')
      .then((res) => {
        const cartItems = res.data?.cart?.items ?? res.data?.data?.items ?? res.data?.items ?? [];
        // Only update if server has items (prevents clearing locally-added items on slow networks)
        if (cartItems.length > 0) setCart(cartItems);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-linen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-indigo-brand">Shopping Cart</h1>
          <Link
            to="/catalog"
            className="text-sm text-saffron-red hover:underline font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* Out-of-stock warning banner */}
        {hasOutOfStock && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Some items in your cart are out of stock and cannot be purchased. Please remove them before checkout.
          </div>
        )}

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-xl font-semibold text-indigo-brand">Your cart is empty</p>
            <p className="text-slate-warm">Looks like you haven't added anything yet.</p>
            <Link
              to="/catalog"
              className="mt-2 bg-saffron-red text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Cart content: items + summary */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Items list */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.variantLabel}`}
                  item={item}
                />
              ))}
            </div>

            {/* Summary sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-indigo-brand text-white">
                  <h2 className="font-bold text-lg">Order Summary</h2>
                </div>
                <CartSummary />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
