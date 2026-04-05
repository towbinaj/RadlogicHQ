/**
 * <auth-ui> Web Component
 * Sign in / sign up modal styled after AcademiQR login page.
 */
import { onAuthChange, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getUser, resetPassword } from '../core/auth.js';

export class AuthUI extends HTMLElement {
  constructor() {
    super();
    this._mode = 'signin';
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="auth-trigger">
        <button class="auth-trigger__btn" id="auth-btn">Sign In</button>
      </div>
      <div class="auth-modal-overlay" style="display:none">
        <div class="auth-modal">
          <!-- Brand -->
          <div class="auth-modal__brand">
            <div class="auth-modal__logo">R</div>
            <div class="auth-modal__brand-name">RadioLogicHQ</div>
          </div>

          <div class="auth-modal__body">
            <!-- Main view (signin / signup) -->
            <div id="auth-main-view">
              <button class="auth-modal__google-btn" id="google-signin">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </button>

              <div class="auth-modal__divider"><span>or</span></div>

              <form class="auth-modal__form" id="auth-form">
                <div class="auth-modal__field">
                  <label for="auth-email">Email</label>
                  <input type="email" id="auth-email" placeholder="Enter your email" required autocomplete="email">
                </div>
                <div class="auth-modal__field">
                  <label for="auth-password">Password</label>
                  <input type="password" id="auth-password" placeholder="Enter your password" required autocomplete="current-password" minlength="6">
                </div>
                <button type="submit" class="auth-modal__primary-btn" id="auth-submit">Sign In</button>
              </form>

              <button class="auth-modal__link" id="auth-forgot">Forgot your password?</button>
              <div class="auth-modal__switch">
                <span class="auth-modal__switch-text" id="auth-switch-text">Don't have an account?</span>
                <button class="auth-modal__switch-btn" id="auth-toggle">Sign Up</button>
              </div>
            </div>

            <!-- Forgot password view -->
            <div id="auth-forgot-view" style="display:none">
              <form class="auth-modal__form" id="forgot-form">
                <div class="auth-modal__field">
                  <label for="forgot-email">Email</label>
                  <input type="email" id="forgot-email" placeholder="Enter your email" required autocomplete="email">
                </div>
                <button type="submit" class="auth-modal__primary-btn">Send Reset Link</button>
              </form>
              <button class="auth-modal__link" id="forgot-back">Back to sign in</button>
            </div>

            <!-- Messages -->
            <div class="auth-modal__error" id="auth-error" style="display:none"></div>
            <div class="auth-modal__success" id="auth-success" style="display:none"></div>
          </div>
        </div>
      </div>
    `;

    this._els = {
      btn: this.querySelector('#auth-btn'),
      overlay: this.querySelector('.auth-modal-overlay'),
      brandName: this.querySelector('.auth-modal__brand-name'),
      mainView: this.querySelector('#auth-main-view'),
      forgotView: this.querySelector('#auth-forgot-view'),
      form: this.querySelector('#auth-form'),
      email: this.querySelector('#auth-email'),
      password: this.querySelector('#auth-password'),
      submit: this.querySelector('#auth-submit'),
      error: this.querySelector('#auth-error'),
      success: this.querySelector('#auth-success'),
      toggle: this.querySelector('#auth-toggle'),
      switchText: this.querySelector('#auth-switch-text'),
      forgot: this.querySelector('#auth-forgot'),
      forgotForm: this.querySelector('#forgot-form'),
      forgotEmail: this.querySelector('#forgot-email'),
      forgotBack: this.querySelector('#forgot-back'),
      google: this.querySelector('#google-signin'),
    };

    onAuthChange((user) => this._updateUI(user));

    this._els.btn.addEventListener('click', () => {
      if (getUser()) { signOut(); } else { this._openModal(); }
    });

    this._els.overlay.addEventListener('click', (e) => {
      if (e.target === this._els.overlay) this._closeModal();
    });

    this._els.toggle.addEventListener('click', () => {
      this._mode = this._mode === 'signin' ? 'signup' : 'signin';
      this._updateMode();
    });

    this._els.forgot.addEventListener('click', () => {
      this._mode = 'forgot';
      this._updateMode();
    });

    this._els.forgotBack.addEventListener('click', () => {
      this._mode = 'signin';
      this._updateMode();
    });

    this._els.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearMessages();
      const email = this._els.email.value;
      const password = this._els.password.value;
      const { error } = this._mode === 'signin'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
      if (error) { this._showError(error); } else { this._closeModal(); }
    });

    this._els.forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearMessages();
      const { error } = await resetPassword(this._els.forgotEmail.value);
      if (error) { this._showError(error); }
      else { this._showSuccess('Password reset email sent. Check your inbox.'); }
    });

    this._els.google.addEventListener('click', async () => {
      this._clearMessages();
      const { error } = await signInWithGoogle();
      if (error) { this._showError(error); } else { this._closeModal(); }
    });
  }

  _updateUI(user) {
    if (user) {
      this._els.btn.textContent = 'Sign Out';
      this._els.btn.title = user.displayName || user.email;
      this._els.btn.classList.add('auth-trigger__btn--user');
    } else {
      this._els.btn.textContent = 'Sign In';
      this._els.btn.title = '';
      this._els.btn.classList.remove('auth-trigger__btn--user');
    }
  }

  _openModal() {
    this._mode = 'signin';
    this._updateMode();
    this._clearMessages();
    this._els.form.reset();
    this._els.overlay.style.display = 'flex';
    setTimeout(() => this._els.email.focus(), 50);
  }

  _closeModal() {
    this._els.overlay.style.display = 'none';
  }

  _updateMode() {
    this._clearMessages();
    const isForgot = this._mode === 'forgot';
    const isSignIn = this._mode === 'signin';

    this._els.mainView.style.display = isForgot ? 'none' : '';
    this._els.forgotView.style.display = isForgot ? '' : 'none';
    this._els.brandName.textContent = isForgot ? 'Reset Password' : 'RadioLogicHQ';

    if (!isForgot) {
      this._els.submit.textContent = isSignIn ? 'Sign In' : 'Create Account';
      this._els.switchText.textContent = isSignIn ? "Don't have an account?" : 'Already have an account?';
      this._els.toggle.textContent = isSignIn ? 'Sign Up' : 'Sign In';
      this._els.password.autocomplete = isSignIn ? 'current-password' : 'new-password';
      this._els.forgot.style.display = isSignIn ? '' : 'none';
    }
  }

  _showError(msg) { this._els.error.textContent = msg; this._els.error.style.display = ''; }
  _showSuccess(msg) { this._els.success.textContent = msg; this._els.success.style.display = ''; }
  _clearMessages() { this._els.error.style.display = 'none'; this._els.success.style.display = 'none'; }
}

customElements.define('auth-ui', AuthUI);
