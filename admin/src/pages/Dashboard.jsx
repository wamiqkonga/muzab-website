import React, { useEffect, useState } from 'react';
import api from '../services/api';

function SummaryCard({ title, value, icon, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border border-gray-100">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        {loading
          ? <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1" />
          : <p className="text-2xl font-bold text-gray-900">{value}</p>
        }
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then((res) => setData(res.data.data ?? res.data))
      .catch((err) => setError(err.response?.data?.error?.message ?? 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Orders Today"       value={data?.totalOrdersToday ?? 0}          icon="🛒" loading={loading} />
        <SummaryCard title="Revenue Today"      value={formatCurrency(data?.totalRevenueToday)} icon="💰" loading={loading} />
        <SummaryCard title="Low Stock Products" value={data?.lowStockProducts?.length ?? 0}  icon="⚠️" loading={loading} />
        <SummaryCard title="New Customers"      value={data?.newCustomersToday ?? 0}          icon="👤" loading={loading} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}</div>
        ) : !data?.lowStockProducts?.length ? (
          <p className="text-gray-500 text-sm text-center py-4">No low-stock products right now.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Product</th><th className="pb-2 text-right">Stock</th><th className="pb-2 text-right">Threshold</th></tr></thead>
            <tbody>
              {data.lowStockProducts.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 text-right"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{p.stock}</span></td>
                  <td className="py-3 text-right text-gray-500">{p.lowStockThreshold ?? 5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
