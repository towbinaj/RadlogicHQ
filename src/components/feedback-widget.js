/**
 * <feedback-widget> Web Component
 *
 * Floating "Feedback" button that opens a modal for bug reports and feature
 * requests. Submissions POST to /api/feedback, which is handled by a
 * Cloudflare Pages Function that creates a GitHub issue in the repo.
 *
 * Self-inserts into <body> on module import — no HTML changes needed.
 */

import { showToast } from '../core/toast.js';

const STYLES = `
  .fbw-trigger {
    position: fixed;
    left: var(--space-md, 16px);
    bottom: var(--space-md, 16px);
    z-index: 998;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 999px;
    font: 600 0.8rem/1 var(--font-sans);
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }
  .fbw-trigger:hover {
    background: var(--bg-elevated);
    border-color: var(--accent);
  }
  .fbw-trigger svg { width: 14px; height: 14px; flex: none; }

  .fbw-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    padding: var(--space-md);
  }
  .fbw-overlay[data-open="true"] { display: flex; }

  .fbw-modal {
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    padding: var(--space-xl);
    box-shadow: var(--shadow-lg);
  }
  .fbw-modal h2 {
    margin: 0 0 4px;
    font-size: var(--text-xl);
    color: var(--text-primary);
  }
  .fbw-modal p.fbw-sub {
    margin: 0 0 var(--space-lg);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .fbw-type {
    display: flex;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);
  }
  .fbw-type input { display: none; }
  .fbw-type label {
    flex: 1;
    text-align: center;
    padding: 8px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-input);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .fbw-type input:checked + label {
    border-color: var(--accent);
    background: var(--accent-subtle);
    color: var(--text-primary);
  }

  .fbw-field {
    display: block;
    margin-bottom: var(--space-md);
  }
  .fbw-field label {
    display: block;
    margin-bottom: 4px;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }
  .fbw-field input,
  .fbw-field textarea {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-input);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font: 0.9rem/1.4 var(--font-sans);
    box-sizing: border-box;
  }
  .fbw-field textarea {
    min-height: 110px;
    resize: vertical;
  }
  .fbw-field input:focus,
  .fbw-field textarea:focus {
    outline: none;
    border-color: var(--border-focus);
  }

  .fbw-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    margin-top: var(--space-lg);
  }
  .fbw-btn {
    padding: 10px 18px;
    border-radius: var(--radius-md);
    font: 600 var(--text-sm) var(--font-sans);
    cursor: pointer;
    border: 1px solid transparent;
    transition: background var(--transition-fast);
  }
  .fbw-btn--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border-color);
  }
  .fbw-btn--ghost:hover { background: var(--bg-elevated); }
  .fbw-btn--primary {
    background: var(--accent);
    color: #fff;
  }
  .fbw-btn--primary:hover { background: var(--accent-hover); }
  .fbw-btn[disabled] { opacity: 0.6; cursor: wait; }

  .fbw-err {
    margin-top: var(--space-sm);
    padding: 10px 12px;
    background: rgba(248, 113, 113, 0.12);
    border: 1px solid var(--danger);
    border-radius: var(--radius-md);
    color: var(--danger);
    font-size: var(--text-sm);
    display: none;
  }
  .fbw-err[data-show="true"] { display: block; }

  /* Honeypot — hidden from humans, visible to naive bots */
  .fbw-hp {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    .fbw-trigger { padding: 10px 14px; font-size: 0.75rem; }
    .fbw-modal { padding: var(--space-lg); }
  }
`;

class FeedbackWidget extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>${STYLES}</style>
      <button type="button" class="fbw-trigger" aria-label="Send feedback">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Feedback
      </button>

      <div class="fbw-overlay" role="dialog" aria-modal="true" aria-labelledby="fbw-title">
        <div class="fbw-modal">
          <h2 id="fbw-title">Send feedback</h2>
          <p class="fbw-sub">Report a bug, request a feature, or ask a question. Goes straight to the maintainer.</p>

          <form class="fbw-form" novalidate>
            <div class="fbw-type">
              <input type="radio" id="fbw-t-bug" name="type" value="bug" checked>
              <label for="fbw-t-bug">Bug</label>
              <input type="radio" id="fbw-t-feat" name="type" value="feature">
              <label for="fbw-t-feat">Feature</label>
              <input type="radio" id="fbw-t-q" name="type" value="question">
              <label for="fbw-t-q">Question</label>
            </div>

            <div class="fbw-field">
              <label for="fbw-subject">Subject</label>
              <input type="text" id="fbw-subject" name="subject" maxlength="100" required>
            </div>

            <div class="fbw-field">
              <label for="fbw-body">Describe it</label>
              <textarea id="fbw-body" name="body" maxlength="2000" required placeholder="What happened / what would you like? If reporting a bug, include what you expected vs what you saw."></textarea>
            </div>

            <div class="fbw-field">
              <label for="fbw-email">Your email <span style="font-weight: 400; color: var(--text-muted);">(optional, for replies)</span></label>
              <input type="email" id="fbw-email" name="email" maxlength="200">
            </div>

            <!-- honeypot: humans never fill this; bots do -->
            <input type="text" class="fbw-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">

            <div class="fbw-err" role="alert"></div>

            <div class="fbw-actions">
              <button type="button" class="fbw-btn fbw-btn--ghost" data-action="cancel">Cancel</button>
              <button type="submit" class="fbw-btn fbw-btn--primary">Send</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this._trigger = this.querySelector('.fbw-trigger');
    this._overlay = this.querySelector('.fbw-overlay');
    this._form = this.querySelector('.fbw-form');
    this._err = this.querySelector('.fbw-err');
    this._submitBtn = this.querySelector('button[type="submit"]');

    this._trigger.addEventListener('click', () => this._open());
    this.querySelector('[data-action="cancel"]').addEventListener('click', () => this._close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this._close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay.dataset.open === 'true') this._close();
    });
    this._form.addEventListener('submit', (e) => this._submit(e));
  }

  _open() {
    this._overlay.dataset.open = 'true';
    setTimeout(() => this.querySelector('#fbw-subject')?.focus(), 50);
  }

  _close() {
    this._overlay.dataset.open = 'false';
    this._err.dataset.show = 'false';
  }

  _showError(msg) {
    this._err.textContent = msg;
    this._err.dataset.show = 'true';
  }

  async _submit(e) {
    e.preventDefault();
    this._err.dataset.show = 'false';

    const data = new FormData(this._form);
    const payload = {
      type: data.get('type'),
      subject: (data.get('subject') || '').trim(),
      body: (data.get('body') || '').trim(),
      email: (data.get('email') || '').trim(),
      website: data.get('website') || '', // honeypot
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    };

    if (payload.subject.length < 3) {
      this._showError('Subject is too short.');
      return;
    }
    if (payload.body.length < 10) {
      this._showError('Please describe it in a bit more detail (at least 10 characters).');
      return;
    }

    this._submitBtn.disabled = true;
    this._submitBtn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error || `HTTP ${res.status}`);
      }
      showToast('Thanks — feedback sent.');
      this._form.reset();
      this._close();
    } catch (err) {
      this._showError(
        `Couldn't send: ${err.message}. You can email radiologichq@gmail.com instead.`
      );
    } finally {
      this._submitBtn.disabled = false;
      this._submitBtn.textContent = 'Send';
    }
  }
}

customElements.define('feedback-widget', FeedbackWidget);

// Self-insert so importers don't need to touch HTML
if (typeof document !== 'undefined') {
  const mount = () => {
    if (!document.querySelector('feedback-widget')) {
      document.body.appendChild(document.createElement('feedback-widget'));
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
}
