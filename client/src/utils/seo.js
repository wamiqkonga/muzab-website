function setMetaTag(selector, attr, value) {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    const [, attrName, attrValue] = selector.match(/\[(\w+)="([^"]+)"\]/) ?? [];
    if (attrName) tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

/**
 * Sets the document title, meta description, canonical URL, and Open
 * Graph/Twitter tags for the current page. Static fallbacks (pointing at
 * the homepage) live in index.html; this overrides them per-route so
 * product/catalog pages don't all claim the homepage's canonical URL and
 * share image.
 */
export function setPageMeta(title, description, options = {}) {
  const fullTitle = title ? `${title} | Muzab` : 'Muzab - Saffron and Skincare';
  document.title = fullTitle;

  if (description) {
    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
  }

  setMetaTag('meta[property="og:title"]', 'content', fullTitle);
  setMetaTag('meta[name="twitter:title"]', 'content', fullTitle);

  const url = `https://www.muzaborganics.com${options.path ?? window.location.pathname}`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
  setMetaTag('meta[property="og:url"]', 'content', url);

  if (options.image) {
    setMetaTag('meta[property="og:image"]', 'content', options.image);
    setMetaTag('meta[name="twitter:image"]', 'content', options.image);
  }
}
