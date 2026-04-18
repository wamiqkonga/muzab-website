import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';

export default function Layout({ children, onSearch }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linen flex flex-col">
      <Header onMenuOpen={() => setMobileMenuOpen(true)} />
      <Navbar onSearch={onSearch} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
