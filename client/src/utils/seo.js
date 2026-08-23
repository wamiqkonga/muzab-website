/**
 * Sets the document title and meta description for the current page.
 * Static fallback lives in index.html; this overrides it per-route.
 */
export function setPageMeta(title, description) {
  document.title = title ? `${title} | Muzab` : 'Muzab - Saffron and Skincare';

  if (description) {
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', description);
  }
}
