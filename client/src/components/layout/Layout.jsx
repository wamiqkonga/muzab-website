import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';

export default function Layout({ children, onSearch }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  // Home has its own hero + category tiles; Catalog has its own (URL-synced)
  // search + category filter — the global Navbar would just duplicate both
  // and, on Catalog, its debounced search silently drops the active category.
  const hideNavbar = pathname === '/' || pathname === '/catalog';

  return (
    <div className="min-h-screen bg-linen flex flex-col">
      <Header onMenuOpen={() => setMobileMenuOpen(true)} />
      {!hideNavbar && <Navbar onSearch={onSearch} />}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
