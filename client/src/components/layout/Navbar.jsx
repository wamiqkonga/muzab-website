import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const CATEGORIES = ['All', 'Saffron', 'Skincare', 'Oils', 'Spices'];

export default function Navbar({ onSearch }) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (onSearch) onSearch(val);
    }, 500);
  }

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <nav className="bg-cream border-b border-gold/20 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2">

          {/* Category links */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={cat === 'All' ? '/catalog' : `/catalog?category=${encodeURIComponent(cat)}`}
                className="flex-shrink-0 flex items-center justify-center h-11 px-4 text-sm font-medium text-warm-gray hover:text-maroon hover:bg-gold/10 rounded-md transition-colors whitespace-nowrap"
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0 w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-warm-gray">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={handleChange}
              placeholder="Search saffron, oils…"
              className="w-full h-11 pl-9 pr-4 text-sm border border-gold/30 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron transition-colors"
              aria-label="Search products"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
