import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import CartSummary from './CartSummary';

export default function CartDrawer({ isOpen, onClose }) {
  const { items } = useCart();
  const hasOutOfStock = items.some((item) => item.outOfStock);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-brand text-white">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Out-of-stock warning banner */}
        {hasOutOfStock && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Some items in your cart are out of stock.
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-warm">Your cart is empty.</p>
              <Link
                to="/catalog"
                onClick={onClose}
                className="bg-saffron-red text-white px-5 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={`${item.productId}-${item.variantLabel}`}
                item={item}
              />
            ))
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && <CartSummary onClose={onClose} />}
      </div>
    </>
  );
}
