import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { setPageMeta } from '../utils/seo';

const CATEGORIES = ['All', 'Saffron', 'Oils', 'Skincare', 'Spices'];
const LIMIT = 12;

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const image = product.images?.[0];
  const price = product.basePrice ?? product.variants?.[0]?.price ?? 0;
  const outOfStock = product.stock === 0 && !product.variants?.some((v) => v.stock > 0);

  async function handleAddToCart(e) {
    e.preventDefault(); // don't navigate to product page
    if (adding || outOfStock) return;
    setAdding(true);
    try {
      // For products with variants, use the first available variant
      const firstAvailableVariant = product.variants?.find((v) => v.stock > 0);
      const variantLabel = firstAvailableVariant?.label ?? null;
      const unitPrice = firstAvailableVariant?.price ?? price;

      await api.post('/api/cart/items', {
        productId: product._id,
        variantLabel,
        quantity: 1,
      });

      addItem({
        productId: product._id,
        name: product.name,
        image,
        variantLabel,
        unitPrice,
      });

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // silently fail — user can try from product detail page
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-linen overflow-hidden flex flex-col relative">
      {outOfStock && (
        <span className="absolute top-2 left-2 z-10 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full">
          Out of Stock
        </span>
      )}
      <Link to={`/products/${product.slug}`} className="block aspect-square bg-linen overflow-hidden">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🛍️</div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-semibold text-indigo-brand text-sm leading-snug mb-1 line-clamp-2 hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="text-slate-warm text-xs mb-3 line-clamp-2 flex-1">{product.description || ''}</p>
        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-indigo-brand font-bold text-base">₹{price.toLocaleString('en-IN')}</span>
          {outOfStock ? (
            <span className="text-xs text-slate-warm bg-gray-100 px-3 py-2 rounded-lg">Out of Stock</span>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-saffron-red hover:bg-red-700 text-white'
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              {adding ? '…' : added ? '✓ Added' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-linen overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [inputValue, setInputValue] = useState(searchParam);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => { setInputValue(searchParam); }, [searchParam]);

  useEffect(() => {
    const title = categoryParam !== 'All' ? categoryParam : 'Shop All Products';
    setPageMeta(title, 'Browse premium Kashmiri saffron, natural oils, skincare, and spices — handpicked, lab-tested, delivered fresh from Muzab.');
  }, [categoryParam]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = { page: pageParam, limit: LIMIT };
    if (searchParam) params.search = searchParam;
    if (categoryParam && categoryParam !== 'All') params.category = categoryParam;

    api.get('/api/products', { params })
      .then((res) => {
        const data = res.data;
        const list = data?.data?.products ?? (Array.isArray(data) ? data : data.products ?? []);
        setProducts(list);
        const total = data?.data?.total ?? data?.total ?? list.length;
        setTotalPages(Math.max(1, Math.ceil(total / LIMIT)));
      })
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [searchParam, categoryParam, pageParam]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) { next.set('search', value); } else { next.delete('search'); }
        next.set('page', '1');
        return next;
      });
    }, 500);
  }, [setSearchParams]);

  const handleCategoryClick = (cat) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === 'All') { next.delete('category'); } else { next.set('category', cat); }
      next.set('page', '1');
      return next;
    });
  };

  const handlePage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-linen">
      <div className="bg-indigo-brand text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Our Products</h1>
          <p className="text-indigo-200 text-sm">Premium saffron &amp; natural products from Kashmir</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <input
            type="search"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Search products…"
            className="w-full md:w-96 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand bg-white"
            aria-label="Search products"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => {
            const active = cat === categoryParam || (cat === 'All' && categoryParam === 'All');
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[44px] ${
                  active
                    ? 'bg-saffron-red text-white'
                    : 'bg-white text-indigo-brand border border-indigo-brand hover:bg-indigo-brand hover:text-white'
                }`}
                aria-pressed={active}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="text-center py-16 text-slate-warm">
            <p className="text-lg mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-saffron-red text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors">
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20 text-slate-warm">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-indigo-brand mb-2">No products found</p>
            <p className="text-sm">Try a different search term or category.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => <ProductCard key={product._id} product={product} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => handlePage(pageParam - 1)}
                  disabled={pageParam <= 1}
                  className="px-5 py-2 rounded-xl border border-indigo-brand text-indigo-brand font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-brand hover:text-white transition-colors min-h-[44px]"
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-warm font-medium">Page {pageParam} of {totalPages}</span>
                <button
                  onClick={() => handlePage(pageParam + 1)}
                  disabled={pageParam >= totalPages}
                  className="px-5 py-2 rounded-xl border border-indigo-brand text-indigo-brand font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-brand hover:text-white transition-colors min-h-[44px]"
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
