import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const STEPS = ['Address', 'Review', 'Payment'];

function CheckoutStepper({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${isCompleted ? 'bg-indigo-brand border-indigo-brand text-white' : isActive ? 'bg-saffron-red border-saffron-red text-white' : 'bg-white border-slate-warm text-slate-warm'}`}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`mt-1 text-xs font-medium ${isActive ? 'text-saffron-red' : isCompleted ? 'text-indigo-brand' : 'text-slate-warm'}`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${isCompleted ? 'bg-indigo-brand' : 'bg-gray-200'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const INITIAL_ADDRESS = { name: '', line1: '', line2: '', city: '', state: '', pinCode: '', phone: '' };

function AddressForm({ onNext }) {
  const [form, setForm] = useState(INITIAL_ADDRESS);
  const [errors, setErrors] = useState({});
  const [pinStatus, setPinStatus] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'pinCode') setPinStatus(null);
  }

  async function handlePinBlur() {
    const pin = form.pinCode.trim();
    if (!/^\d{6}$/.test(pin)) return;
    setPinStatus('checking');
    try {
      await api.post('/api/orders/checkout', { address: { ...form, pinCode: pin }, validateOnly: true });
      setPinStatus('ok');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      setPinStatus(code === 'UNSERVICEABLE_PIN' ? 'unavailable' : 'ok');
    }
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.line1.trim()) e.line1 = 'Address line 1 is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.pinCode.trim()) e.pinCode = 'PIN code is required';
    else if (!/^\d{6}$/.test(form.pinCode.trim())) e.pinCode = 'PIN code must be 6 digits';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (pinStatus === 'unavailable') return;
    onNext(form);
  }

  const inputClass = (field) => `w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-saffron-red transition ${errors[field] ? 'border-red-500' : 'border-gray-300'}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-indigo-brand mb-1">Full Name <span className="text-saffron-red">*</span></label>
        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Recipient's full name" className={inputClass('name')} />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-indigo-brand mb-1">Address Line 1 <span className="text-saffron-red">*</span></label>
        <input type="text" name="line1" value={form.line1} onChange={handleChange} placeholder="House / Flat / Block No., Street" className={inputClass('line1')} />
        {errors.line1 && <p className="mt-1 text-xs text-red-500">{errors.line1}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-indigo-brand mb-1">Address Line 2 <span className="text-slate-warm text-xs">(optional)</span></label>
        <input type="text" name="line2" value={form.line2} onChange={handleChange} placeholder="Landmark, Area" className={inputClass('line2')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-indigo-brand mb-1">City <span className="text-saffron-red">*</span></label>
          <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" className={inputClass('city')} />
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-indigo-brand mb-1">State <span className="text-saffron-red">*</span></label>
          <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="State" className={inputClass('state')} />
          {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-indigo-brand mb-1">PIN Code <span className="text-saffron-red">*</span></label>
          <input type="text" name="pinCode" value={form.pinCode} onChange={handleChange} onBlur={handlePinBlur} placeholder="6-digit PIN" maxLength={6} className={inputClass('pinCode')} />
          {errors.pinCode && <p className="mt-1 text-xs text-red-500">{errors.pinCode}</p>}
          {pinStatus === 'checking' && <p className="mt-1 text-xs text-slate-warm">Checking serviceability...</p>}
          {pinStatus === 'unavailable' && <p className="mt-1 text-xs text-red-500">Delivery unavailable to this PIN code.</p>}
          {pinStatus === 'ok' && <p className="mt-1 text-xs text-green-600">Delivery available</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-indigo-brand mb-1">Phone <span className="text-saffron-red">*</span></label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile" maxLength={10} className={inputClass('phone')} />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>
      <button type="submit" disabled={pinStatus === 'unavailable' || pinStatus === 'checking'}
        className="w-full mt-2 py-3 rounded-md bg-saffron-red text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
        Continue to Review
      </button>
    </form>
  );
}

const GST_RATE = 0.18;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

function OrderReview({ onBack, onNext, addressData }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/cart')
      .then((res) => setCart(res.data.data || res.data))
      .catch(() => setError('Failed to load cart. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-slate-warm text-sm">Loading order summary...</div>;
  if (error) return <div className="py-12 text-center text-red-500 text-sm">{error}</div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const shippingFee = cart?.shippingFee ?? null;
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + (shippingFee ?? 0) + gst;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-indigo-brand">Order Summary</h2>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
        {items.length === 0 && <p className="p-4 text-sm text-slate-warm text-center">Your cart is empty.</p>}
        {items.map((item) => (
          <div key={item._id || item.productId} className="flex items-center gap-3 p-3">
            {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-brand truncate">{item.name}</p>
              {item.variantLabel && <p className="text-xs text-slate-warm">{item.variantLabel}</p>}
              <p className="text-xs text-slate-warm">Qty: {item.quantity} x {formatCurrency(item.unitPrice)}</p>
            </div>
            <p className="text-sm font-semibold text-indigo-brand flex-shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="bg-linen rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between text-slate-warm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between text-slate-warm"><span>Shipping</span><span>{shippingFee !== null ? formatCurrency(shippingFee) : 'Calculated at checkout'}</span></div>
        <div className="flex justify-between text-slate-warm"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></div>
        <div className="flex justify-between font-bold text-indigo-brand border-t border-gray-200 pt-2 mt-2"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
      </div>
      {addressData && (
        <div className="text-xs text-slate-warm bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-indigo-brand mb-1">Delivering to:</p>
          <p>{addressData.name}, {addressData.line1}{addressData.line2 ? `, ${addressData.line2}` : ''}</p>
          <p>{addressData.city}, {addressData.state} - {addressData.pinCode}</p>
          <p>Phone: {addressData.phone}</p>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-md border border-indigo-brand text-indigo-brand text-sm font-medium hover:bg-indigo-brand hover:text-white transition">Back</button>
        <button onClick={() => onNext({ subtotal, shippingFee, gst, grandTotal, items })} disabled={items.length === 0}
          className="flex-1 py-3 rounded-md bg-saffron-red text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          Proceed to Payment
        </button>
      </div>
    </div>
  );
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

function PaymentStep({ onBack, addressData, orderSummary }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codEligible, setCodEligible] = useState(false);

  useEffect(() => {
    api.post('/api/orders/checkout', { deliveryAddress: addressData, paymentMethod: 'razorpay', checkOnly: true })
      .then((res) => { const d = res.data.data || res.data; setCodEligible(!!d.codEligible); })
      .catch(() => {});
  }, [addressData]);

  const initiateCheckout = useCallback(async (paymentMethod) => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/orders/checkout', { deliveryAddress: addressData, paymentMethod });
      return res.data.data || res.data;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to initiate checkout. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addressData]);

  async function handleRazorpay() {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) { setError('Failed to load payment gateway. Please check your connection.'); return; }
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
        setLoading(true); setError('');
        try {
          await api.post('/api/orders/verify-payment', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderSummary,
          });
          navigate('/my-orders', { state: { successMessage: 'Order placed successfully!' } });
        } catch (err) {
          setError(err.response?.data?.error?.message || 'Payment verification failed. Please contact support.');
          setLoading(false);
        }
      },
      prefill: { name: addressData?.name, contact: addressData?.phone },
      theme: { color: '#C0392B' },
      modal: { ondismiss: () => { setLoading(false); setError('Payment was cancelled. Your cart is intact.'); } },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setLoading(false); });
    rzp.open();
  }

  async function handleCOD() {
    const data = await initiateCheckout('cod');
    if (!data) return;
    navigate('/my-orders', { state: { successMessage: 'Order placed! Pay on delivery.' } });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-indigo-brand">Payment</h2>
      {orderSummary && (
        <div className="bg-linen rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between text-slate-warm"><span>Subtotal</span><span>{formatCurrency(orderSummary.subtotal)}</span></div>
          <div className="flex justify-between text-slate-warm"><span>Shipping</span><span>{orderSummary.shippingFee !== null ? formatCurrency(orderSummary.shippingFee) : 'Calculated at checkout'}</span></div>
          <div className="flex justify-between text-slate-warm"><span>GST (18%)</span><span>{formatCurrency(orderSummary.gst)}</span></div>
          <div className="flex justify-between font-bold text-indigo-brand border-t border-gray-200 pt-2 mt-1"><span>Grand Total</span><span>{formatCurrency(orderSummary.grandTotal)}</span></div>
        </div>
      )}
      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
      <div className="space-y-3">
        <button onClick={handleRazorpay} disabled={loading}
          className="w-full py-3 rounded-md bg-saffron-red text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Processing...' : 'Pay with Razorpay'}
        </button>
        {codEligible && (
          <button onClick={handleCOD} disabled={loading}
            className="w-full py-3 rounded-md border-2 border-indigo-brand text-indigo-brand text-sm font-semibold hover:bg-indigo-brand hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
            Pay on Delivery (COD)
          </button>
        )}
      </div>
      <button onClick={onBack} disabled={loading} className="w-full py-2 text-sm text-slate-warm hover:text-indigo-brand transition disabled:opacity-50">
        Back to Order Review
      </button>
    </div>
  );
}

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);

  return (
    <div className="min-h-screen bg-linen py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-indigo-brand text-center mb-1">Muzab</h1>
        <p className="text-xs text-slate-warm text-center mb-6">Secure Checkout</p>
        <CheckoutStepper currentStep={step} />
        {step === 1 && <AddressForm onNext={(data) => { setAddressData(data); setStep(2); }} />}
        {step === 2 && <OrderReview onBack={() => setStep(1)} onNext={(summary) => { setOrderSummary(summary); setStep(3); }} addressData={addressData} />}
        {step === 3 && <PaymentStep onBack={() => setStep(2)} addressData={addressData} orderSummary={orderSummary} />}
      </div>
    </div>
  );
}
