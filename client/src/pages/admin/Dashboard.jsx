import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function SummaryCard({ title, value, icon, loading }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-slate-warm">{title}</p>
        {loading ? (
          <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold text-indigo-brand">{value}</p>
        )}
      </div>
    </div>
  );
}

function LowStockAlert({ items, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />)}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return <p className="text-slate-warm text-sm py-4 text-center">No low-stock products right now.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-warm border-b border-gray-100">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 font-medium text-right">Stock</th>
            <th className="pb-2 font-medium text-right">Threshold</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product._id} className="border-b border-gray-50 last:border-0">
              <td className="py-3 font-medium text-gray-800">{product.name}</td>
              <td className="py-3 text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-saffron-red">{product.stock}</span>
              </td>
              <td className="py-3 text-right text-slate-warm">{product.lowStockThreshold ?? 5}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get('/api/admin/dashboard')
      .then((res) => { if (!cancelled) setData(res.data.data ?? res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error?.message ?? 'Failed to load dashboard.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);

  return (
    <div className="min-h-screen bg-linen">
      <header className="bg-indigo-brand text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold tracking-wide">Muzab Admin — Dashboard</h1>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {error && <div className="bg-red-50 border border-red-200 text-saffron-red rounded-lg px-4 py-3 text-sm">{error}</div>}
        <section>
          <h2 className="text-lg font-semibold text-indigo-brand mb-4">Today's Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Orders Today" value={data?.totalOrdersToday ?? 0} icon="🛒" loading={loading} />
            <SummaryCard title="Revenue Today" value={formatCurrency(data?.totalRevenueToday)} icon="💰" loading={loading} />
            <SummaryCard title="Low Stock Products" value={data?.lowStockProducts?.length ?? 0} icon="⚠️" loading={loading} />
            <SummaryCard title="New Customers Today" value={data?.newCustomersToday ?? 0} icon="👤" loading={loading} />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-indigo-brand mb-4">Low Stock Alerts</h2>
          <LowStockAlert items={data?.lowStockProducts} loading={loading} />
        </section>
      </main>
    </div>
  );
}
