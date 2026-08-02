import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const INPUT_BASE = 'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-maroon transition';
const inputClass = (err) => `${INPUT_BASE} ${err ? 'border-red-400' : 'border-gray-300'}`;

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, gst, grandTotal, clearCart } = useCart();

  // Contact
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');

  // Address
  const [form, setForm] = useState({
    name: user?.name || '',
    line1: '', line2: '', city: '', state: '', pinCode: '', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [pinStatus, setPinStatus] = useState(null); // null | 'checking' | 'ok' | 'unavailable'

  // Payment
  const [codEligible, setCodEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  // Check COD eligibility when pinCode becomes a valid 6-digit number
  useEffect(() => {
    const pin = form.pinCode.trim();
    if (!/^\d{6}$/.test(pin)) { setCodEligible(false); return; }
    api.get(`/api/orders/cod-eligibility?pin=${pin}`)
      .then((res) => setCodEligible(!!res.data.eligible))
      .catch(() => setCodEligible(false));
  }, [form.pinCode]);

  async function handlePinBlur() {
    const pin = form.pinCode.trim();
    if (!/^\d{6}$/.test(pin)) return;
    setPinStatus('ok'); // all valid 6-digit PINs are serviceable pan-India
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'pinCode') setPinStatus(null);
  }

  function validate() {
    const e = {};
    if (!user && !email.trim()) e.email = 'Email is required to track your order';
    else if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.line1.trim()) e.line1 = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!form.pinCode.trim()) e.pinCode = 'PIN code is required';
    else if (!/^\d{6}$/.test(form.pinCode.trim())) e.pinCode = 'PIN code must be 6 digits';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit number';
    return e;
  }

  const initiateCheckout = useCallback(async (paymentMethod) => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setEmailError(validationErrors.email || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return null;
    }
    if (pinStatus === 'unavailable') {
      setErrors((prev) => ({ ...prev, pinCode: 'Delivery unavailable to this PIN code' }));
      return null;
    }
    setLoading(true);
    setPageError('');
    try {
      const payload = {
        deliveryAddress: form,
        paymentMethod,
        guestEmail: user ? undefined : email.trim().toLowerCase(),
      };
      const res = await api.post('/api/orders/checkout', payload);
      return res.data.data || res.data;
    } catch (err) {
      setPageError(err.response?.data?.error?.message || 'Failed to initiate checkout. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [form, email, pinStatus, user]);


  async function handleRazorpay() {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) { setPageError('Failed to load payment gateway. Check your connection.'); return; }
    const data = await initiateCheckout('razorpay');
    if (!data) return;
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency || 'INR',
      order_id: data.razorpayOrderId,
      name: 'Muzab',
      description: 'Premium Saffron & Natural Products',
      handler: async function (response) {
        setLoading(true); setPageError('');
        try {
          const verifyRes = await api.post('/api/orders/verify-payment', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderSummary: data.orderSummary,
            guestEmail: user ? undefined : email.trim().toLowerCase(),
          });
          const order = verifyRes.data.order;
          clearCart();
          navigate(`/order-confirmation/${order.confirmationToken}`);
        } catch (err) {
          setPageError(err.response?.data?.error?.message || 'Payment verification failed. Contact support.');
          setLoading(false);
        }
      },
      prefill: { name: form.name, contact: form.phone, email: email || user?.email },
      theme: { color: '#800020' },
      modal: { ondismiss: () => { setLoading(false); setPageError('Payment was cancelled. Your cart is intact.'); } },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => { setPageError('Payment failed. Please try again.'); setLoading(false); });
    rzp.open();
  }

  async function handleCOD() {
    const data = await initiateCheckout('cod');
    if (!data) return;
    const order = data.order || data;
    clearCart();
    navigate(`/order-confirmation/${order.confirmationToken}`);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-linen flex flex-col items-center justify-center gap-4 px-4">
        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-lg font-semibold text-indigo-brand">Your cart is empty</p>
        <Link to="/catalog" className="bg-maroon text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-900 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-linen py-8 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-1">
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <circle cx="17" cy="17" r="17" fill="#D4AF37" />
            <text x="17" y="23" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#800020" fontFamily="serif">م</text>
          </svg>
          <span className="text-xl font-serif font-bold text-maroon">Muzab</span>
        </Link>
        <p className="text-xs text-slate-warm flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure Checkout
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* ── Left: Form ── */}
        <div className="space-y-6">

          {pageError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {pageError}
            </div>
          )}

          {/* Contact */}
          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-bold text-maroon mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Contact Information
            </h2>
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs text-slate-warm font-normal">— for order confirmation &amp; tracking</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="you@example.com"
                  className={inputClass(emailError)}
                  autoComplete="email"
                />
                {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
                <p className="mt-2 text-xs text-slate-warm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-maroon font-medium hover:underline">Sign in</Link>
                  {' '}for faster checkout.
                </p>
              </div>
            )}
            {user && (
              <p className="text-sm text-gray-700">
                Signed in as <span className="font-semibold">{user.name}</span> ({user.email})
              </p>
            )}
          </section>

          {/* Delivery Address */}
          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-bold text-maroon mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Delivery Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Recipient's full name" className={inputClass(errors.name)} autoComplete="name" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input type="text" name="line1" value={form.line1} onChange={handleChange} placeholder="House / Flat / Block No., Street" className={inputClass(errors.line1)} autoComplete="address-line1" />
                {errors.line1 && <p className="mt-1 text-xs text-red-500">{errors.line1}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 <span className="text-xs text-slate-warm font-normal">(optional)</span></label>
                <input type="text" name="line2" value={form.line2} onChange={handleChange} placeholder="Landmark, Area, Colony" className={inputClass(false)} autoComplete="address-line2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" className={inputClass(errors.city)} autoComplete="address-level2" />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="State" className={inputClass(errors.state)} autoComplete="address-level1" />
                  {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code <span className="text-red-500">*</span></label>
                  <input type="text" name="pinCode" value={form.pinCode} onChange={handleChange} onBlur={handlePinBlur} placeholder="6-digit PIN" maxLength={6} className={inputClass(errors.pinCode || pinStatus === 'unavailable')} autoComplete="postal-code" />
                  {errors.pinCode && <p className="mt-1 text-xs text-red-500">{errors.pinCode}</p>}
                  {!errors.pinCode && pinStatus === 'checking' && <p className="mt-1 text-xs text-slate-warm">Checking availability...</p>}
                  {!errors.pinCode && pinStatus === 'unavailable' && <p className="mt-1 text-xs text-red-500">Delivery not available to this PIN code.</p>}
                  {!errors.pinCode && pinStatus === 'ok' && <p className="mt-1 text-xs text-green-600">✓ Delivery available</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile" maxLength={10} className={inputClass(errors.phone)} autoComplete="tel" />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-bold text-maroon mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Payment
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleRazorpay}
                disabled={loading || pinStatus === 'unavailable'}
                className="w-full py-3.5 rounded-xl font-bold text-base bg-maroon text-white hover:bg-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Processing...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> Pay Online (Cards, UPI, Net Banking)</>
                )}
              </button>
              {codEligible && (
                <button
                  onClick={handleCOD}
                  disabled={loading || pinStatus === 'unavailable'}
                  className="w-full py-3.5 rounded-xl font-bold text-base border-2 border-maroon text-maroon hover:bg-maroon hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cash on Delivery (COD)
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-warm text-center flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              Payments are secured and encrypted
            </p>
          </section>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-maroon text-white px-5 py-4">
              <h2 className="font-bold text-base">Order Summary</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantLabel}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative flex-shrink-0">
                    <img src={item.image || '/placeholder-product.png'} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                    <span className="absolute -top-1.5 -right-1.5 bg-maroon text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    {item.variantLabel && <p className="text-xs text-slate-warm">{item.variantLabel}</p>}
                  </div>
                  <p className="text-sm font-semibold text-maroon flex-shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 space-y-2 border-t border-gray-100">
              <div className="flex justify-between text-sm text-slate-warm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-slate-warm"><span>Shipping</span><span className="text-xs">Calculated at checkout</span></div>
              <div className="flex justify-between text-sm text-slate-warm"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></div>
              <div className="flex justify-between font-bold text-base text-maroon border-t border-gray-200 pt-2 mt-1">
                <span>Total</span><span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            <div className="px-5 pb-4">
              <Link to="/cart" className="text-xs text-maroon hover:underline flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                Edit cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
