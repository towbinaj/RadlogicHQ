/**
 * Auto-patches tool page hero bar, breadcrumb, and document title
 * with user's custom tool name (if set).
 *
 * Import this from any tool's JS entry to enable custom naming on that page.
 * The tool ID is detected from the URL path.
 */
import { getToolDisplayName, getStored } from './storage.js';
import { validationBadgeHtml } from '../data/tools-registry.js';
import '../components/feedback-widget.js';

// Apply compact mode globally on all tool pages
if (getStored('compact') === 1 || getStored('compact') === '1') {
  document.body.classList.add('compact');
}

const pathMatch = window.location.pathname.match(/\/src\/tools\/([^/]+)\//);
if (pathMatch) {
  const toolId = pathMatch[1];

  // Read the default name from the h1 text (before the Ref link)
  const h1 = document.querySelector('.tool-hero__text h1');
  if (h1) {
    const refLink = h1.querySelector('.tool-hero__ref');
    const defaultName = h1.textContent.replace(/\s*Ref\s*$/, '').trim();
    const displayName = getToolDisplayName(toolId, defaultName);

    if (displayName !== defaultName) {
      h1.textContent = displayName + ' ';
      if (refLink) h1.appendChild(refLink);

      const breadcrumb = document.querySelector('.breadcrumb__current');
      if (breadcrumb) breadcrumb.textContent = displayName;

      document.title = document.title.replace(defaultName, displayName);
    }

    // Append the validation badge after the Ref link (or at the end of the h1
    // if there's no ref link). Use insertAdjacentHTML to avoid clobbering any
    // inline elements already in the h1.
    if (!h1.querySelector('.validation-badge')) {
      const badgeHtml = validationBadgeHtml(toolId);
      if (refLink) {
        refLink.insertAdjacentHTML('afterend', badgeHtml);
      } else {
        h1.insertAdjacentHTML('beforeend', badgeHtml);
      }
    }
  }
}
