import React from 'react';

const STATUS_STYLES = {
  Confirmed: 'bg-indigo-100 text-indigo-800',
  Processing: 'bg-yellow-100 text-yellow-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Refunded: 'bg-gray-100 text-gray-800',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}
