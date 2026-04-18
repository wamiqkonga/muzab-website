import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const linkClass = 'flex items-center h-11 px-6 text-base font-medium text-gray-800 hover:bg-cream hover:text-maroon transition-colors';

export default function MobileMenu({ isOpen, onClose }) {
  const { user } = useAuth();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between px-4 h-16 bg-maroon text-white flex-shrink-0">
          <span className="font-serif text-lg font-bold text-gold">Muzab</span>
          <button onClick={onClose} className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors" aria-label="Close menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <Link to="/"        onClick={onClose} className={linkClass}>Home</Link>
          <Link to="/catalog" onClick={onClose} className={linkClass}>Shop</Link>
          <Link to="/cart"    onClick={onClose} className={linkClass}>Cart</Link>
          <div className="my-2 border-t border-gray-100" />
          {user ? (
            <Link to="/my-orders" onClick={onClose} className={linkClass}>My Orders</Link>
          ) : (
            <>
              <Link to="/login"    onClick={onClose} className={linkClass}>Login</Link>
              <Link to="/register" onClick={onClose} className={linkClass}>Register</Link>
            </>
          )}
        </nav>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 text-sm text-warm-gray">
          <a href="tel:+919086660267" className="flex items-center gap-2 h-11 hover:text-maroon transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +91-9086660267
          </a>
        </div>
      </div>
    </>
  );
}
