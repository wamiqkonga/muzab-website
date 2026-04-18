import React from 'react';
import { useCart } from '../../context/CartContext';

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCart();
  const { productId, name, image, variantLabel, unitPrice, quantity, outOfStock } = item;
  const lineTotal = unitPrice * quantity;

  function handleDecrement() {
    if (quantity > 1) updateItem(productId, variantLabel, quantity - 1);
  }

  function handleIncrement() {
    updateItem(productId, variantLabel, quantity + 1);
  }

  function handleRemove() {
    removeItem(productId, variantLabel);
  }

  return (
    <div className={`flex gap-3 py-4 border-b border-gray-200 last:border-0 ${outOfStock ? 'opacity-75' : ''}`}>
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <img
          src={image || '/placeholder-product.png'}
          alt={name}
          className="w-16 h-16 object-cover rounded-md bg-gray-100"
        />
        {outOfStock && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded">
            Out of Stock
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-brand truncate">{name}</p>
        {variantLabel && (
          <p className="text-xs text-slate-warm mt-0.5">{variantLabel}</p>
        )}
        <p className="text-xs text-slate-warm mt-0.5">{formatINR(unitPrice)} each</p>

        {/* Quantity stepper + remove */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="flex items-center justify-center w-11 h-11 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={handleIncrement}
            className="flex items-center justify-center w-11 h-11 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Increase quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={handleRemove}
            className="flex items-center justify-center w-11 h-11 ml-auto rounded-md text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Remove item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-indigo-brand">{formatINR(lineTotal)}</p>
      </div>
    </div>
  );
}
