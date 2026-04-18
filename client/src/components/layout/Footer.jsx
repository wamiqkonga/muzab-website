import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-maroon text-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-gold mb-3">Muzab</h2>
            <p className="text-sm text-white/65 leading-relaxed">
              Premium Kashmiri saffron and natural products — sourced directly from the farms of Kashmir.
            </p>
            <div className="flex items-center gap-2 mt-4">
              {/* Organic badge */}
              <span className="inline-flex items-center gap-1 text-xs bg-forest/40 text-green-200 px-2 py-1 rounded-full border border-green-700/40">
                🌿 100% Natural
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-gold/20 text-gold px-2 py-1 rounded-full border border-gold/30">
                ✓ Lab Tested
              </span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">Contact</h3>
            <address className="not-italic text-sm text-white/65 space-y-2">
              <p>Srinagar, J&amp;K, India</p>
              <p>
                <a href="tel:+919086660267" className="hover:text-gold transition-colors">
                  +91-9086660267
                </a>
              </p>
            </address>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-white/65">
              <li><Link to="/catalog" className="hover:text-gold transition-colors">Shop Saffron</Link></li>
              <li><Link to="/catalog?category=Oils" className="hover:text-gold transition-colors">Natural Oils</Link></li>
              <li><Link to="/my-orders" className="hover:text-gold transition-colors">My Orders</Link></li>
              <li><Link to="/register" className="hover:text-gold transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span>&copy; {new Date().getFullYear()} Muzab. All rights reserved.</span>
          <span>Pure Kashmiri Saffron — Direct from Farms</span>
        </div>
      </div>
    </footer>
  );
}
