import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { setPageMeta } from '../utils/seo';
import Reveal from '../components/Reveal';

const CATEGORIES = [
  { name: 'Saffron', slug: 'Saffron', emoji: '🌸', description: 'Pure Kashmiri Mongra & Lacha' },
  { name: 'Skincare',slug: 'Skincare',emoji: '✨', description: 'Saffron-infused skincare' },
  { name: 'Oils',    slug: 'Oils',    emoji: '🫙', description: 'Cold-pressed natural oils' },
  { name: 'Spices',  slug: 'Spices',  emoji: '🌿', description: 'Premium Kashmiri spices' },
];

const BENEFITS = [
  { icon: '🛡️', title: 'Boosts Immunity',    desc: 'Rich in antioxidants that strengthen your immune system naturally.' },
  { icon: '✨', title: 'Glowing Skin',        desc: "Saffron's natural compounds brighten and even skin tone." },
  { icon: '🧠', title: 'Mood & Memory',       desc: 'Traditionally used to support mental clarity and uplift mood.' },
  { icon: '❤️', title: 'Heart Health',        desc: 'Helps maintain healthy cholesterol and blood pressure levels.' },
];

const SKINCARE_BENEFITS = [
  { icon: '🌿', title: 'Deep Cleansing',      desc: 'Neem and multani mitti draw out impurities and excess oil for naturally clear skin.' },
  { icon: '🌾', title: 'Gentle Exfoliation',  desc: 'Cinnamon and nutmeg gently buff away dullness, leaving skin soft and awakened.' },
  { icon: '🌸', title: 'Natural Radiance',    desc: 'Saffron is traditionally used to brighten and even out skin tone.' },
  { icon: '💧', title: 'Soothing Hydration',  desc: 'Rose water and aloe vera calm and hydrate skin, perfect for everyday use.' },
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
    <Link to={`/products/${product.slug}`} className="group bg-white rounded-md shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col border border-gold/25">
      <div className="relative aspect-[4/5] bg-cream flex items-center justify-center overflow-hidden">
        {image
          ? <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <span className="text-6xl">🌸</span>
        }
        <span className="absolute top-3 left-3 px-3 py-1 bg-maroon/90 rounded-sm text-[10px] font-semibold uppercase tracking-wider text-gold">
          {product.category || 'Saffron'}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 className="font-serif font-semibold text-maroon text-lg leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-warm-gray text-xs italic">Pampore Valley, Kashmir</p>
        {product.averageRating > 0 ? (
          <div className="flex items-center gap-1">
            <StarRating count={Math.round(product.averageRating)} />
            <span className="text-xs text-warm-gray">({product.reviewCount})</span>
          </div>
        ) : (
          <p className="text-xs text-warm-gray">No reviews yet</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-saffron font-bold text-xl">₹{price.toLocaleString('en-IN')}</span>
          {inStock ? (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`text-xs font-semibold px-4 py-2 rounded transition-colors min-h-[40px] flex items-center border ${added ? 'border-green-600 text-green-700 bg-green-50' : 'border-maroon text-maroon hover:bg-maroon hover:text-white'}`}
            >
              {adding ? '…' : added ? '✓ Added' : 'Add to Cart'}
            </button>
          ) : (
            <span className="text-xs text-warm-gray bg-gray-100 px-3 py-2 rounded">Out of Stock</span>
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
    setPageMeta(null, 'Pure Kashmiri saffron, direct from farms — handpicked, lab-tested, and delivered fresh. Shop saffron, natural oils, skincare, and spices at Muzab.');
  }, []);

  useEffect(() => {
    api.get('/api/products', { params: { limit: 24 } })
      .then((res) => {
        const data = res.data;
        // API returns { success, data: { products, total } } or { products }
        const list = data?.data?.products ?? data?.products ?? (Array.isArray(data) ? data : []);
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const CATEGORY_ORDER = ['Saffron', 'Skincare', 'Oils', 'Spices'];
  const productsByCategory = CATEGORY_ORDER
    .map((cat) => ({ category: cat, items: products.filter((p) => p.category === cat) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_82%_8%,#93042A_0%,#800020_42%,#5C0016_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_90%_0%,rgba(212,175,55,0.16)_0%,rgba(212,175,55,0)_70%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
            {/* Copy */}
            <div className="flex-1 flex flex-col gap-6 text-center md:text-left items-center md:items-start animate-fade-in-up motion-reduce:animate-none">
              <div className="flex items-center gap-3">
                <span className="hidden md:block w-8 h-px bg-gold" />
                <span className="text-gold text-xs font-semibold uppercase tracking-[0.18em]">
                  Hand-Harvested in Pampore, Kashmir
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-[1.1]">
                Pure Kashmiri Saffron<br />
                <span className="text-gold italic font-medium">Direct from Farms</span>
              </h1>
              <p className="text-white/75 text-base md:text-lg max-w-md leading-relaxed">
                Each thread hand-plucked from crocus blooms at dawn, lab-tested for purity, and shipped within 48 hours — the same saffron Kashmiri households have trusted for generations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-1">
                <Link to="/catalog" className="inline-flex items-center justify-center h-12 px-8 bg-gold hover:bg-gold/90 text-maroon-dark font-semibold rounded text-sm transition-all hover:scale-[1.03] active:scale-95">
                  Explore the Collection
                </Link>
                <Link to="/catalog?category=Saffron" className="inline-flex items-center justify-center h-12 px-2 border-b border-white/40 hover:border-gold text-white hover:text-gold font-medium text-sm transition-colors">
                  Our Story →
                </Link>
              </div>
            </div>

            {/* Photo collage */}
            <div className="relative flex-shrink-0 w-full max-w-xs md:max-w-none md:w-[340px] h-[300px] md:h-[380px] animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: '150ms' }}>
              <div className="absolute right-0 md:right-4 top-0 w-[72%] h-[85%] rounded overflow-hidden border border-gold/50 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <img
                  src="https://res.cloudinary.com/ddbuapktu/image/upload/v1788892000/close-up-saffron-still-life-arrangement_1_jhkqrj.jpg"
                  alt="Kashmiri saffron threads, hand-harvested"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute left-0 bottom-0 w-[52%] h-[42%] rounded overflow-hidden border border-gold/70 shadow-xl transition-transform duration-500 hover:scale-[1.04]">
                <img
                  src="https://res.cloudinary.com/ddbuapktu/image/upload/v1788891713/pexels-merve-safa-364773899-14411011_ne3buu.jpg"
                  alt="Fresh saffron crocus flowers, hand-picked in Kashmir"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-12 md:mt-16">
            <span className="w-20 h-px bg-gold/40" />
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
              <path d="M1 7 Q 6 1, 11 7 T 21 7" stroke="#D4AF37" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="w-20 h-px bg-gold/40" />
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-wrap md:flex-nowrap items-stretch">
          {[
            { label: '100% Natural', d: 'M12 21c-4-2.5-7-6-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5C19 15 16 18.5 12 21Z M12 8v6M9.5 10.5 12 8l2.5 2.5' },
            { label: 'Lab-Tested Purity', d: 'M9 3h6M10 3v5.2L5.5 16a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.2V3 M8 14h8' },
            { label: 'Hand-Harvested', d: 'M7 11V6a2 2 0 1 1 4 0v5M11 10V4.5a2 2 0 1 1 4 0V10M15 10.5V6a2 2 0 1 1 4 0v6c0 5-3 8-7 8s-6-2-7.5-5L3 11.5A1.7 1.7 0 0 1 5.8 9.6L7 11' },
            { label: 'Free Shipping ₹999+', d: 'M3 7h11v9H3z M14 10h4l3 3v3h-7z' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <Reveal as="div" delay={i * 90} className="flex-1 min-w-[45%] md:min-w-0 flex flex-col items-center gap-3 px-4 py-2">
                <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#800020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {item.d.split(' M').map((seg, si) => <path key={si} d={si === 0 ? seg : `M${seg}`} />)}
                  </svg>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-maroon-dark text-center">{item.label}</span>
              </Reveal>
              {i < arr.length - 1 && <span className="hidden md:block w-px bg-maroon/10 my-1" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Reveal>
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Our Story</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2 mb-5">
            Four Generations in Kashmir's Saffron Fields
          </h2>
          <p className="text-warm-gray text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Muzab carries four generations of a single family's saffron trade — from my great-grandfather's fields
            in Pampore, to my grandfather, to my father, and now to me. What was once carried village to village by
            hand, I've now brought online — but the saffron itself hasn't changed: hand-harvested from the same
            Kashmir valley, graded with the same care, and sent out only after it meets the standard my family has
            held for generations.
          </p>
        </Reveal>
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-center">
          {[['4', 'Generations'], ['100%', 'Pure & Natural'], ['2', 'Signature Blends'], ['Kashmir', 'Direct-Sourced']].map(([val, label], i) => (
            <Reveal as="div" key={label} delay={i * 100}>
              <p className="font-serif text-3xl font-bold text-saffron">{val}</p>
              <p className="text-xs text-warm-gray mt-1">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal as="div" className="text-center mb-10">
            <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Our Products</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Featured Collection</h2>
          </Reveal>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-cream rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : productsByCategory.length > 0 ? (
            <div className="flex flex-col gap-14">
              {productsByCategory.map(({ category, items }) => (
                <div key={category}>
                  <Reveal as="div" className="flex items-center gap-4 mb-6">
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-maroon whitespace-nowrap">{category}</h3>
                    <span className="flex-1 h-px bg-gold/25" />
                  </Reveal>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((p, i) => (
                      <Reveal as="div" key={p._id} delay={(i % 3) * 90}>
                        <ProductCard product={p} />
                      </Reveal>
                    ))}
                    {category === 'Saffron' && items.length < 3 && (
                      <Reveal as="div" delay={(items.length % 3) * 90} className="flex flex-col items-center justify-center gap-4 border border-dashed border-maroon/30 rounded-md p-10 text-center">
                        <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#800020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </div>
                        <h3 className="font-serif font-semibold text-maroon text-lg">More Origins,<br />Coming Soon</h3>
                        <p className="text-warm-gray text-xs leading-relaxed max-w-[220px]">Cold-pressed oils and Kashmiri spices — arriving this season.</p>
                      </Reveal>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-warm-gray py-10">Products coming soon.</p>
          )}
          <div className="text-center mt-10">
            <Link to="/catalog" className="inline-flex items-center justify-center h-12 px-8 border-2 border-maroon text-maroon hover:bg-maroon hover:text-white font-semibold rounded-xl transition-all hover:scale-[1.03] active:scale-95">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <Reveal as="div" className="text-center mb-12">
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Why Saffron?</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Health Benefits</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b, i) => (
            <Reveal as="div" key={b.title} delay={i * 90} className="bg-white rounded-2xl p-6 shadow-soft border border-gold/10 text-center hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <span className="text-4xl block mb-3">{b.icon}</span>
              <h3 className="font-serif font-semibold text-maroon text-base mb-2">{b.title}</h3>
              <p className="text-warm-gray text-sm leading-relaxed">{b.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Skincare Benefits ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <Reveal as="div" className="text-center mb-12">
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Why Our Skincare?</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Skin Benefits</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SKINCARE_BENEFITS.map((b, i) => (
            <Reveal as="div" key={b.title} delay={i * 90} className="bg-white rounded-2xl p-6 shadow-soft border border-gold/10 text-center hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <span className="text-4xl block mb-3">{b.icon}</span>
              <h3 className="font-serif font-semibold text-maroon text-base mb-2">{b.title}</h3>
              <p className="text-warm-gray text-sm leading-relaxed">{b.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-maroon text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal as="div" className="text-center mb-12">
            <span className="text-gold text-xs font-semibold uppercase tracking-widest">Our Promise</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">Why Choose Muzab?</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w, i) => (
              <Reveal as="div" key={w.title} delay={i * 90} className="text-center p-6 rounded-2xl border border-white/10 hover:border-gold/40 hover:-translate-y-1 transition-all duration-300">
                <span className="text-4xl block mb-3">{w.icon}</span>
                <h3 className="font-serif font-semibold text-gold text-base mb-2">{w.title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{w.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Tiles ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <Reveal as="div" className="text-center mb-10">
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Browse</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">Shop by Category</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal as="div" key={cat.slug} delay={i * 90}>
              <Link
                to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                className="group bg-white hover:bg-maroon rounded-2xl shadow-soft border border-gold/10 p-6 flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-card hover:-translate-y-1"
              >
                <span className="text-4xl">{cat.emoji}</span>
                <span className="font-serif font-semibold text-maroon group-hover:text-gold text-sm text-center transition-colors">{cat.name}</span>
                <span className="text-xs text-warm-gray group-hover:text-white/70 text-center transition-colors">{cat.description}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal as="div" className="text-center mb-12">
            <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Reviews</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-maroon mt-2">What Our Customers Say</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal as="div" key={t.name} delay={i * 110} className="bg-cream rounded-2xl p-6 border border-gold/15 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                <StarRating count={t.rating} />
                <p className="text-warm-gray text-sm leading-relaxed mt-3 mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-maroon text-sm">{t.name}</p>
                  <p className="text-xs text-warm-gray">{t.location}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Reveal>
          <span className="text-saffron text-xs font-semibold uppercase tracking-widest">Quality Assurance</span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-maroon mt-2 mb-8">Certified & Trusted</h2>
        </Reveal>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { icon: '🌿', label: 'Organic Certified' },
            { icon: '🔬', label: 'Lab Tested' },
            { icon: '✅', label: 'Quality Assured' },
            { icon: '🏔️', label: 'Kashmir Origin' },
          ].map((c, i) => (
            <Reveal as="div" key={c.label} delay={i * 90} className="flex flex-col items-center gap-2 bg-white border border-gold/20 rounded-2xl px-8 py-5 shadow-soft min-w-[120px] hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-semibold text-maroon text-center">{c.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-r from-saffron to-saffron-dark text-white py-20 text-center">
        <Reveal as="div" className="max-w-3xl mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
            Experience the Purity of Real Saffron
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join hundreds of customers who trust Muzab for authentic Kashmiri saffron.
          </p>
          <Link to="/catalog" className="inline-flex items-center justify-center h-14 px-10 bg-white text-saffron hover:bg-cream font-bold rounded-xl text-lg transition-all shadow-lg hover:scale-[1.04] active:scale-95">
            Shop Now
          </Link>
        </Reveal>
      </section>

    </div>
  );
}
