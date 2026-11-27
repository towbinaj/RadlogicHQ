/**
 * 404 page: suggest the tool the visitor probably meant, plus a quick search.
 * Deliberately does not load <auth-ui> so a stray URL never pulls in Firebase.
 */
import '../styles/base.css';
import './not-found.css';
import { toolsRegistry } from '../data/tools-registry.js';

const tools = toolsRegistry.filter((t) => t.status === 'active' && t.path);

// Lowercase, strip everything but letters/digits so "TI-RADS", "ti_rads"
// and "tirads" all compare equal.
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

function renderList(el, items) {
  el.replaceChildren(
    ...items.map((t) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = t.path;
      a.textContent = t.name;
      const desc = document.createElement('span');
      desc.className = 'not-found__desc';
      desc.textContent = t.description;
      li.append(a, desc);
      return li;
    })
  );
}

// --- Suggestions from the requested path ---
// e.g. /tirads, /src/tools/ti-rads/, /bosniak.html -> matching tool(s)
const tokens = decodeURIComponent(location.pathname)
  .split(/[/.]+/)
  .map(norm)
  .filter((t) => t.length >= 3 && !['src', 'tools', 'pages', 'html'].includes(t));

const suggestions = tools.filter((t) => {
  const id = norm(t.id);
  const name = norm(t.name);
  return tokens.some((tok) => id === tok || name === tok || id.includes(tok) || tok.includes(id));
});

if (suggestions.length > 0) {
  renderList(document.getElementById('nf-suggest-list'), suggestions.slice(0, 5));
  document.getElementById('nf-suggest').hidden = false;
}

// --- Live search ---
const searchEl = document.getElementById('nf-search');
const resultsEl = document.getElementById('nf-results');

searchEl.addEventListener('input', () => {
  const q = norm(searchEl.value);
  if (!q) {
    resultsEl.replaceChildren();
    return;
  }
  const matches = tools.filter(
    (t) => norm(t.name).includes(q) || norm(t.id).includes(q) || norm(t.description).includes(q)
  );
  renderList(resultsEl, matches.slice(0, 8));
});

searchEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const first = resultsEl.querySelector('a');
    if (first) location.href = first.href;
  }
});
