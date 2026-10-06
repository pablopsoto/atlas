const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for interpolation into HTML. */
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const lifespan = (born: number | null, died: number | null) => `${born ?? '?'}–${died ?? ''}`;

/** Run a DOM update inside a View Transition when the browser supports it. */
export function transition(update: () => void) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  document.startViewTransition(update);
}

export const fmt = new Intl.NumberFormat('en');
