import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../cart/CartDrawer';
import api from '../../services/api';

export default function Header({ onMenuOpen }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  async function handleLogout() {
    logout();
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    navigate('/');
  }

  return (
    <>
      <header className="bg-maroon text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Mobile menu button + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={onMenuOpen}
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to="/" className="flex items-center gap-2 group">
                {/* Gold saffron flower logo mark */}
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                  <circle cx="17" cy="17" r="17" fill="#D4AF37" />
                  <text x="17" y="23" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#800020" fontFamily="serif">م</text>
                </svg>
                <span className="text-xl font-serif font-bold tracking-wide text-white group-hover:text-gold transition-colors">
                  Muzab
                </span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-white/85 hover:text-gold font-medium transition-colors text-sm">Home</Link>
              <Link to="/catalog" className="text-white/85 hover:text-gold font-medium transition-colors text-sm">Shop</Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <a href="tel:+919086660267" className="hidden lg:flex items-center gap-1 text-xs text-white/70 hover:text-gold transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +91-9086660267
              </a>

              {/* Cart — drawer on desktop */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative hidden md:flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors"
                aria-label={`Cart, ${itemCount} items`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-maroon text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>

              {/* Cart — navigate on mobile */}
              <Link
                to="/cart"
                className="relative md:hidden flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors"
                aria-label={`Cart, ${itemCount} items`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-maroon text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 min-w-[44px] h-11 px-2 rounded-md hover:bg-white/10 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-card py-1 z-50 border border-gray-100">
                      <Link to="/my-orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-maroon transition-colors">My Orders</Link>
                      <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-cream hover:text-maroon transition-colors">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1">
                  <Link to="/login" className="flex items-center justify-center h-11 px-3 text-sm font-medium text-white/85 hover:text-gold transition-colors">Login</Link>
                  <Link to="/register" className="flex items-center justify-center h-11 px-4 text-sm font-semibold bg-saffron hover:bg-saffron-dark text-white rounded-md transition-colors">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
