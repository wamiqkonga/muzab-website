import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setPageMeta } from '../utils/seo';

export default function NotFound() {
  useEffect(() => {
    setPageMeta('Page Not Found', 'The page you are looking for does not exist.');
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', 'noindex, follow');
    return () => tag?.remove();
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-24 bg-cream">
      <span className="text-saffron text-xs font-semibold uppercase tracking-widest">404 Error</span>
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-maroon mt-3 mb-4">Page Not Found</h1>
      <p className="text-warm-gray text-base max-w-md mb-8">
        The page you're looking for may have moved or no longer exists. Let's get you back on track.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/" className="inline-flex items-center justify-center h-12 px-8 bg-maroon hover:bg-maroon-dark text-white font-semibold rounded text-sm transition-colors">
          Back to Home
        </Link>
        <Link to="/catalog" className="inline-flex items-center justify-center h-12 px-8 border-2 border-maroon text-maroon hover:bg-maroon hover:text-white font-semibold rounded text-sm transition-colors">
          Shop All Products
        </Link>
      </div>
    </div>
  );
}
