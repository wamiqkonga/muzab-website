import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  { name: 'Saffron', slug: 'Saffron', emoji: '🌸', description: 'Pure Kashmiri Mongra & Lacha' },
  { name: 'Oils',    slug: 'Oils',    emoji: '🫙', description: 'Cold-pressed natural oils' },
  { name: 'Skincare',slug: 'Skincare',emoji: '✨', description: 'Saffron-infused skincare' },
  { name: 'Spices',  slug: 'Spices',  emoji: '🌿', description: 'Premium Kashmiri spices' },
];

const BENEFITS = [
  { icon: '🛡️', title: 'Boosts Immunity',    desc: 'Rich in antioxidants that strengthen your immune system naturally.' },
  { icon: '✨', title: 'Glowing Skin',        desc: "Saffron's natural compounds brighten and even skin tone." },
  { icon: '🧠', title: 'Mood & Memory',       desc: 'Traditionally used to support mental clarity and uplift mood.' },
  { icon: '❤️', title: 'Heart Health',        desc: 'Helps maintain healthy cholesterol and blood pressure levels.' },
];

const WHY_US = [
  { icon: '🌱', title: '100% Pure',        desc: 'No additives, fillers, or artificial colour — ever.' },
  { icon: '🔬', title: 'Lab Tested',       desc: 'Every batch is third-party tested for purity and potency.' },
  { icon: '✋', title: 'Handpicked',        desc: 'Carefully harvested by skilled farmers in Kashmir.' },
  { icon: '🚜', title: 'Direct Sourcing',  desc: 'Farm-to-door — no middlemen, maximum freshness.' },
];

const TESTIMONIALS = [
  { name: 'Aisha R.',    location: 'Delhi',     rating: 5, text: "The Mongra saffron is absolutely divine. The colour and aroma are unlike anything I've bought before." },
  { name: 'Rahul M.',    location: 'Mumbai',    rating: 5, text: 'Ordered twice already. The quality is consistent and packaging is beautiful. Highly recommend!' },
  { name: 'Fatima K.',   location: 'Hyderabad', rating: 5, text: 'Finally found authentic Kashmiri saffron. The lab certificate gave me full confidence in the purchase.' },
];

function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-gold fill-gold" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const image = product.images?.[0];
  const price = product.basePrice ?? product.variants?.[0]?.price ?? 0;
  const inStock = product.stock > 0 || product.variants?.some((v) => v.stock > 0);

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;
    setAdding(true);
    try {
      const firstAvailableVariant = product.variants?.find((v) => v.stock > 0);
      const variantLabel = firstAvailableVariant?.label ?? null;
      const unitPrice = firstAvailableVariant?.price ?? price;
      await api.post('/api/cart/items', { productId: product._id, variantLabel, quantity: 1 });
      addItem({ productId: product._id, name: product.name, image, variantLabel, unitPrice });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch { /* silently fail */ } finally { setAdding(false); }
  }

  return (
    <Link to={`/products/${product.slug}`} className="group bg-white rounded-2xl shadow-soft hover:shadow-card transition-shadow overflow-hidden flex flex-col border border-gold/10">
      <div className="aspect-square bg-cream flex items-center justify-center overflow-hidden">
        {image
          ? <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <span className="text-6xl">🌸</span>
        }
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-saffron font-semibold uppercase tracking-wider mb-1">{product.category || 'Saffron'}</p>
        <h3 className="font-serif font-semibold text-maroon text-base leading-snug mb-1 line-clamp-2">{product.name}</h3>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <StarRating count={Math.round(product.averageRating)} />
            <span className="text-xs text-warm-gray">({product.reviewCount})</span>
          </div>
        )}
        <p className="text-warm-gray text-xs mb-4 line-clamp-2 flex-1">{product.description || ''}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-maroon font-bold text-lg font-serif">₹{price.toLocaleString('en-IN')}</span>
          {inStock ? (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors min-h-[44px] flex items-center ${added ? 'bg-green-600' : 'bg-saffron hover:bg-saffron-dark'}`}
            >
              {adding ? '…' : added ? '✓ Added' : 'Add to Cart'}
            </button>
          ) : (
            <span className="text-xs text-warm-gray bg-gray-100 px-3 py-2 rounded-lg">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/products', { params: { limit: 6 } })
      .then((res) => {
        const data = res.data;
        // API returns { success, data: { products, total } } or { products }
        const list = data?.data?.products ?? data?.products ?? (Array.isArray(data) ? data : []);
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero ── */}
      <section className="relative bg-maroon text-white overflow-hidden">
        {/* subtle gold gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-maroon via-maroon to-[#4a0012] opacity-90 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center gap-7">
          <span className="inline-block text-gold text-sm font-semibold uppercase tracking-widest border border-gold/40 px-4 py-1 rounded-full">
            Kashmir's Finest
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight">
            Pure Kashmiri Saffron<br />
            <span className="text-gold">Direct from Farms</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl leading-relaxed">
            Handpicked, lab-tested, and delivered fresh — experience the world's most prized spice.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/catalog" className="inline-flex items-center justify-center h-12 px-8 bg-saffron hover:bg-saffron-dark text-white font-semibold rounded-xl text-base transition-colors shadow-lg">
              Shop Now
            </Link>
            <Link to="/catalog?category=Saffron" className="inline-flex items-center justify-center h-12 px-8 border border-gold/50 text-gold hover:bg-gold/10 font-semibold rounded-xl text-base transition-colors">
              View Saffron
            </Link>
          </div>
          {/* trust badges */}
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {['🌿 100% Natural', '🔬 Lab Tested', '✋ Handpicked', '🚚 Free Shipping ₹999+'].map((b) => (
              <span key={b} className="text-xs text-white/60 border border-white/15 px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Our Story</span>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2 mb-5">
          Rooted in Kashmir, Crafted with Tradition
        </h2>
        <p className="text-warm-gray text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
          Muzab was born from a simple belief — that the world deserves access to truly authentic Kashmiri saffron.
          We partner directly with small-scale farmers in the Pampore region, the saffron capital of India, ensuring
          every strand you receive is harvested with care, tested for purity, and delivered with pride.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-center">
          {[['500+', 'Happy Customers'], ['3', 'Saffron Variants'], ['100%', 'Pure & Natural'], ['5★', 'Average Rating']].map(([val, label]) => (
            <div key={label}>
              <p className="font-serif text-3xl font-bold text-saffron">{val}</p>
              <p className="text-xs text-warm-gray mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Our Products</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Featured Collection</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-cream rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <p className="text-center text-warm-gray py-10">Products coming soon.</p>
          )}
          <div className="text-center mt-10">
            <Link to="/catalog" className="inline-flex items-center justify-center h-12 px-8 border-2 border-maroon text-maroon hover:bg-maroon hover:text-white font-semibold rounded-xl transition-colors">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Why Saffron?</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Health Benefits</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white rounded-2xl p-6 shadow-soft border border-gold/10 text-center hover:shadow-card transition-shadow">
              <span className="text-4xl block mb-3">{b.icon}</span>
              <h3 className="font-serif font-semibold text-maroon text-base mb-2">{b.title}</h3>
              <p className="text-warm-gray text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-maroon text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-gold text-xs font-semibold uppercase tracking-widest">Our Promise</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">Why Choose Muzab?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w) => (
              <div key={w.title} className="text-center p-6 rounded-2xl border border-white/10 hover:border-gold/40 transition-colors">
                <span className="text-4xl block mb-3">{w.icon}</span>
                <h3 className="font-serif font-semibold text-gold text-base mb-2">{w.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Tiles ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Browse</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
              className="group bg-white hover:bg-maroon rounded-2xl shadow-soft border border-gold/10 p-6 flex flex-col items-center gap-3 transition-all hover:shadow-card"
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span className="font-serif font-semibold text-maroon group-hover:text-gold text-sm text-center transition-colors">{cat.name}</span>
              <span className="text-xs text-warm-gray group-hover:text-white/70 text-center transition-colors">{cat.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Reviews</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-cream rounded-2xl p-6 border border-gold/15 shadow-soft">
                <StarRating count={t.rating} />
                <p className="text-warm-gray text-sm leading-relaxed mt-3 mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-maroon text-sm">{t.name}</p>
                  <p className="text-xs text-warm-gray">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Quality Assurance</span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-maroon mt-2 mb-8">Certified & Trusted</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { icon: '🌿', label: 'Organic Certified' },
            { icon: '🔬', label: 'Lab Tested' },
            { icon: '✅', label: 'Quality Assured' },
            { icon: '🏔️', label: 'Kashmir Origin' },
          ].map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-2 bg-white border border-gold/20 rounded-2xl px-8 py-5 shadow-soft min-w-[120px]">
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-semibold text-maroon text-center">{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-r from-saffron to-saffron-dark text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
            Experience the Purity of Real Saffron
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join hundreds of customers who trust Muzab for authentic Kashmiri saffron.
          </p>
          <Link to="/catalog" className="inline-flex items-center justify-center h-14 px-10 bg-white text-saffron hover:bg-cream font-bold rounded-xl text-lg transition-colors shadow-lg">
            Shop Now
          </Link>
        </div>
      </section>

    </div>
  );
}
