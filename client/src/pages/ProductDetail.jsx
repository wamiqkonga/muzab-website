import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function StarRating({ rating, max = 5, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';
  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < Math.floor(rating) ? 'text-gold' : 'text-gray-300'}>
          {i < Math.floor(rating) ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function ProductGallery({ images, name }) {
  const [mainIdx, setMainIdx] = useState(0);
  const hasImages = images && images.length > 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-2xl overflow-hidden bg-linen border border-gray-100 flex items-center justify-center">
        {hasImages ? (
          <img src={images[mainIdx]} alt={`${name} image ${mainIdx + 1}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-8xl select-none">🛍️</span>
        )}
      </div>
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button key={idx} onClick={() => setMainIdx(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${idx === mainIdx ? 'border-saffron-red' : 'border-transparent hover:border-gold'}`}
              aria-label={`View image ${idx + 1}`}>
              <img src={src} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantSelector({ variants, selectedIdx, onSelect }) {
  if (!variants || variants.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-indigo-brand mb-2">Select Variant</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v, idx) => {
          const oos = v.stock === 0;
          const active = idx === selectedIdx;
          return (
            <button key={idx} onClick={() => !oos && onSelect(idx)} disabled={oos}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${active ? 'bg-indigo-brand text-white border-indigo-brand' : oos ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through' : 'bg-white text-indigo-brand border-indigo-brand hover:bg-indigo-brand hover:text-white'}`}
              aria-pressed={active}>
              {v.label}{v.price != null && <span className="ml-1 text-xs opacity-75">₹{v.price.toLocaleString('en-IN')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewList({ productId, averageRating, reviewCount }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!productId) return;
    api.get('/api/reviews', { params: { productId } })
      .then((res) => setReviews(Array.isArray(res.data) ? res.data : res.data.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-indigo-brand mb-4">Customer Reviews</h2>
      {reviewCount > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-linen">
          <span className="text-4xl font-extrabold text-indigo-brand">{(averageRating ?? 0).toFixed(1)}</span>
          <div>
            <StarRating rating={averageRating ?? 0} size="lg" />
            <p className="text-sm text-slate-warm mt-0.5">Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
          </div>
        </div>
      )}
      {loading && <div className="animate-pulse space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>}
      {!loading && reviews.length === 0 && <p className="text-slate-warm text-sm py-4">No reviews yet.</p>}
      {!loading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r._id} className="bg-white rounded-xl p-4 border border-linen">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-indigo-brand text-sm">{r.userId?.name ?? 'Verified Buyer'}</span>
                <time className="text-xs text-slate-warm">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
              </div>
              <StarRating rating={r.rating} size="sm" />
              {r.text && <p className="text-sm text-gray-700 mt-2">{r.text}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/products/${slug}`)
      .then((res) => { setProduct(res.data.product ?? res.data); setSelectedVariantIdx(0); })
      .catch((err) => setError(err.response?.status === 404 ? 'Product not found.' : 'Failed to load product.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const hasVariants = product?.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? product.variants[selectedVariantIdx] : null;
  const displayPrice = selectedVariant?.price ?? product?.basePrice ?? 0;
  const displayStock = selectedVariant != null ? selectedVariant.stock : (product?.stock ?? 0);
  const inStock = displayStock > 0;

  const handleAddToCart = async () => {
    if (!inStock) return;
    setAddingToCart(true); setCartMessage(null);
    try {
      await api.post('/api/cart/items', { productId: product._id, variantLabel: selectedVariant?.label ?? null, quantity: 1 });
      setCartMessage({ type: 'success', text: 'Added to cart!' });
    } catch (err) {
      setCartMessage({ type: 'error', text: err.response?.data?.error?.message ?? 'Could not add to cart.' });
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  if (loading) return <div className="min-h-screen bg-linen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-brand border-t-transparent rounded-full" /></div>;
  if (error) return (
    <div className="min-h-screen bg-linen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-5xl">😕</p>
      <p className="text-lg font-semibold text-indigo-brand">{error}</p>
      <Link to="/catalog" className="bg-saffron-red text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors">Back to Catalog</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-linen">
      <div className="bg-white border-b border-linen">
        <div className="max-w-5xl mx-auto px-4 py-3 text-sm text-slate-warm flex gap-2">
          <Link to="/" className="hover:text-indigo-brand">Home</Link><span>/</span>
          <Link to="/catalog" className="hover:text-indigo-brand">Catalog</Link><span>/</span>
          <span className="text-indigo-brand font-medium truncate">{product.name}</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <ProductGallery images={product.images} name={product.name} />
          <div className="flex flex-col gap-5">
            {product.category && <span className="inline-block self-start bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full uppercase">{product.category}</span>}
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-brand">{product.name}</h1>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating ?? 0} size="sm" />
                <span className="text-sm text-slate-warm">{(product.averageRating ?? 0).toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
            <span className="text-3xl font-extrabold text-saffron-red">₹{displayPrice.toLocaleString('en-IN')}</span>
            <div>
              {inStock
                ? <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />In Stock</span>
                : <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Out of Stock</span>}
            </div>
            {hasVariants && <VariantSelector variants={product.variants} selectedIdx={selectedVariantIdx} onSelect={setSelectedVariantIdx} />}
            <div className="flex flex-col gap-2">
              <button onClick={handleAddToCart} disabled={!inStock || addingToCart}
                className={`w-full py-4 rounded-xl font-bold text-base transition-colors min-h-[44px] ${inStock ? 'bg-saffron-red hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {addingToCart ? 'Adding…' : inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              {cartMessage && <p className={`text-sm text-center font-medium ${cartMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`} role="status">{cartMessage.text}</p>}
            </div>
            {product.description && <div><h2 className="text-sm font-bold text-indigo-brand uppercase mb-1">Description</h2><p className="text-sm text-gray-700 leading-relaxed">{product.description}</p></div>}
            {product.ingredients && <div className="bg-white rounded-xl border border-linen p-4"><h2 className="text-sm font-bold text-indigo-brand uppercase mb-1">Ingredients / Materials</h2><p className="text-sm text-gray-700 leading-relaxed">{product.ingredients}</p></div>}
          </div>
        </div>
        <ReviewList productId={product._id} averageRating={product.averageRating} reviewCount={product.reviewCount} />
      </div>
    </div>
  );
}
