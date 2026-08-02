import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const fetchCustomers = useCallback(() => {
    setLoading(true); setError(null);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    api.get('/api/admin/customers', { params })
      .then((res) => {
        const d = res.data.data ?? res.data;
        setCustomers(d.customers ?? []);
        const total = d.pagination?.total ?? d.customers?.length ?? 0;
        setTotalPages(Math.max(1, Math.ceil(total / 20)));
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? 'Failed to load customers.'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await api.get('/api/admin/customers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export customers.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-linen">
      <header className="bg-indigo-brand text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold tracking-wide">Muzab Admin - Customers</h1>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand flex-1 max-w-sm" />
          <button onClick={handleExport} disabled={exporting}
            className="px-4 py-2 bg-indigo-brand text-white text-sm font-semibold rounded-lg hover:bg-indigo-900 transition-colors disabled:opacity-60">
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-saffron-red rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-slate-warm text-sm">No customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-slate-warm">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{customer.name}</td>
                      <td className="px-4 py-3 text-slate-warm">{customer.email}</td>
                      <td className="px-4 py-3 text-slate-warm">{customer.phone || '-'}</td>
                      <td className="px-4 py-3 text-slate-warm text-xs">
                        {customer.registeredAt ? new Date(customer.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-indigo-brand text-indigo-brand text-sm disabled:opacity-40 hover:bg-indigo-brand hover:text-white transition-colors">
              Prev
            </button>
            <span className="text-sm text-slate-warm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-indigo-brand text-indigo-brand text-sm disabled:opacity-40 hover:bg-indigo-brand hover:text-white transition-colors">
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
