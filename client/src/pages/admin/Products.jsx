import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Saffron', 'Oils', 'Skincare', 'Supplements', 'Accessories', 'Other'];
const EMPTY_FORM = { name: '', category: '', description: '', basePrice: '', stock: '', images: [''], isActive: true };

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);
}

function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product ? {
    name: product.name ?? '', category: product.category ?? '', description: product.description ?? '',
    basePrice: product.basePrice ?? '', stock: product.stock ?? '',
    images: product.images?.length ? product.images : [''], isActive: product.isActive ?? true,
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function setField(key, value) { setForm((f) => ({ ...f, [key]: value })); }
  function setImage(index, value) { setForm((f) => { const imgs = [...f.images]; imgs[index] = value; return { ...f, images: imgs }; }); }
  function addImageField() { setForm((f) => ({ ...f, images: [...f.images, ''] })); }
  function removeImageField(index) { setForm((f) => { const imgs = f.images.filter((_, i) => i !== index); return { ...f, images: imgs.length ? imgs : [''] }; }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = { ...form, basePrice: Number(form.basePrice), stock: Number(form.stock), images: form.images.filter((u) => u.trim() !== '') };
    setSaving(true);
    try {
      if (product) { await api.put(`/api/products/${product._id}`, payload); }
      else { await api.post('/api/products', payload); }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Failed to save product.');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-indigo-brand">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-slate-warm hover:text-gray-700 text-2xl leading-none" aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-saffron-red rounded-lg px-4 py-2 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-saffron-red">*</span></label>
            <input type="text" required value={form.name} onChange={(e) => setField('name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand" placeholder="e.g. Pure Kashmiri Saffron" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-saffron-red">*</span></label>
            <select required value={form.category} onChange={(e) => setField('category', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand">
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-saffron-red">*</span></label>
            <textarea required rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand resize-none" placeholder="Short product description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Rs.) <span className="text-saffron-red">*</span></label>
              <input type="number" required min="0" step="0.01" value={form.basePrice} onChange={(e) => setField('basePrice', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock <span className="text-saffron-red">*</span></label>
              <input type="number" required min="0" step="1" value={form.stock} onChange={(e) => setField('stock', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs <span className="text-saffron-red">*</span></label>
            <p className="text-xs text-slate-warm mb-2">Enter direct image URLs (Cloudinary upload handled server-side).</p>
            <div className="space-y-2">
              {form.images.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="url" value={url} onChange={(e) => setImage(idx, e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand" placeholder="https://res.cloudinary.com/..." />
                  {form.images.length > 1 && <button type="button" onClick={() => removeImageField(idx)} className="text-saffron-red hover:text-red-700 text-lg leading-none px-1" aria-label="Remove image">&times;</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={addImageField} className="mt-2 text-sm text-indigo-brand hover:underline">+ Add another image URL</button>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" role="switch" aria-checked={form.isActive} onClick={() => setField('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-brand ${form.isActive ? 'bg-indigo-brand' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-700">{form.isActive ? 'Active (visible on storefront)' : 'Inactive (hidden from storefront)'}</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded-lg bg-saffron-red text-white font-semibold hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ product, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setDeleting(true); setError(null);
    try {
      await api.delete(`/api/products/${product._id}`);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Failed to delete product.');
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-indigo-brand">Delete Product</h2>
        <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-semibold">{product.name}</span>? This will hide it from the storefront.</p>
        {error && <div className="bg-red-50 border border-red-200 text-saffron-red rounded-lg px-4 py-2 text-sm">{error}</div>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-5 py-2 text-sm rounded-lg bg-saffron-red text-white font-semibold hover:bg-red-700 disabled:opacity-60">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const fetchProducts = useCallback(() => {
    setLoading(true); setError(null);
    api.get('/api/products?limit=50')
      .then((res) => { const data = res.data?.data ?? res.data; setProducts(Array.isArray(data) ? data : data?.products ?? []); })
      .catch((err) => { setError(err.response?.data?.error?.message ?? 'Failed to load products.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-linen">
      <header className="bg-indigo-brand text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold tracking-wide">Muzab Admin - Products</h1>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-indigo-brand">All Products</h2>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="px-4 py-2 bg-saffron-red text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
            + Add Product
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-saffron-red rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-6">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-slate-warm text-sm">No products found. <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="text-indigo-brand hover:underline">Add your first product.</button></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-slate-warm">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg flex-shrink-0">📦</div>
                          )}
                          <span className="font-medium text-gray-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-warm">{product.category}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{formatINR(product.basePrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${product.stock === 0 ? 'text-saffron-red' : product.stock <= (product.lowStockThreshold ?? 5) ? 'text-gold' : 'text-gray-800'}`}>{product.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-warm'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditProduct(product); setShowForm(true); }} className="px-3 py-1 text-xs rounded-md bg-indigo-brand text-white hover:bg-indigo-900 transition-colors">Edit</button>
                          <button onClick={() => setDeleteProduct(product)} className="px-3 py-1 text-xs rounded-md bg-red-50 text-saffron-red hover:bg-red-100 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      {showForm && <ProductForm product={editProduct} onClose={() => { setShowForm(false); setEditProduct(null); }} onSaved={() => { setShowForm(false); setEditProduct(null); fetchProducts(); }} />}
      {deleteProduct && <DeleteConfirm product={deleteProduct} onClose={() => setDeleteProduct(null)} onDeleted={() => { setDeleteProduct(null); fetchProducts(); }} />}
    </div>
  );
}
