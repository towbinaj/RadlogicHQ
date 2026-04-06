import '../styles/base.css';
import '../styles/forms.css';
import '../components/auth-ui.js';

document.getElementById('privacy-content').innerHTML = `
<h1>Privacy Policy</h1>
<p><em>Last updated: April 5, 2026</em></p>

<h2>Overview</h2>
<p>RadioLogicHQ is a radiology calculator and reporting tool. We are committed to protecting your privacy and complying with applicable data protection regulations including GDPR and HIPAA.</p>

<h2>HIPAA Compliance</h2>
<p>RadioLogicHQ does <strong>not</strong> store Protected Health Information (PHI). The application is designed as a clinical reference tool that:</p>
<ul>
  <li>Does not capture patient names, medical record numbers, accession numbers, or dates of birth</li>
  <li>Does not record timestamps of individual report generation</li>
  <li>Does not log IP addresses in application data</li>
  <li>Stores only aggregate, non-identifiable usage counters for analytics</li>
  <li>Saved reports contain only classification criteria (scoring categories and measurements), not patient-identifying information</li>
</ul>
<p><strong>Users must not enter patient-identifying information into any field.</strong> RadioLogicHQ is a scoring and template tool, not a medical record system.</p>

<h2>What Data We Collect</h2>

<h3>Account Information</h3>
<p>When you create an account, we collect:</p>
<ul>
  <li><strong>Email address</strong> — used for authentication and account recovery</li>
  <li><strong>Display name</strong> — optional, shown in the app header</li>
</ul>

<h3>User Preferences</h3>
<p>We store your tool preferences (compact mode, size units, section order) to provide a consistent experience across sessions.</p>

<h3>Custom Report Templates</h3>
<p>When you customize report templates (block order, display text, custom fields), these configurations are saved to your account.</p>

<h3>Saved Reports</h3>
<p>Report text you choose to save is stored with a user-assigned label. No timestamps or IP addresses are associated with saved reports.</p>

<h3>Aggregate Analytics</h3>
<p>We track aggregate usage counters (total reports generated per tool, template format popularity). These counters contain no user identifiers, no timestamps, and no IP addresses. They cannot be traced to individual users.</p>

<h2>Authentication</h2>
<p>Authentication is provided by Google Firebase. Firebase Auth stores:</p>
<ul>
  <li>Email address and hashed password (or Google OAuth token)</li>
  <li>Account creation date and last sign-in date</li>
  <li>IP address of last sign-in (managed by Google, not accessible to our application)</li>
</ul>
<p>Firebase Auth data is governed by <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">Google's Firebase Privacy Policy</a> and <a href="https://cloud.google.com/terms/data-processing-addendum" target="_blank" rel="noopener">Data Processing Addendum</a>.</p>

<h2>Data Processing</h2>
<p><strong>Data processor:</strong> Google Cloud / Firebase (Firestore database, Firebase Authentication)</p>
<p><strong>Legal basis for processing:</strong></p>
<ul>
  <li><strong>Consent</strong> — provided at account creation</li>
  <li><strong>Legitimate interest</strong> — essential functionality (saving preferences, templates)</li>
</ul>

<h2>Third-Party Data Sharing</h2>
<p>We do not sell, share, or transfer your data to third parties beyond what is necessary for the service:</p>
<ul>
  <li><strong>Google Firebase</strong> — authentication and data storage</li>
  <li><strong>Netlify</strong> — website hosting (no user data stored on Netlify)</li>
</ul>
<p>No advertising networks, analytics services, or tracking pixels are used. Fonts are self-hosted — no requests to Google Fonts or other CDNs.</p>

<h2>Cookies</h2>
<p>RadioLogicHQ does not set cookies. Authentication session data is stored in browser IndexedDB by Firebase Auth. Preferences are stored in browser localStorage.</p>

<h2>Your Rights (GDPR)</h2>
<p>If you are in the European Union, you have the right to:</p>
<ul>
  <li><strong>Access</strong> your data — available via the "Export My Data" button on your profile page</li>
  <li><strong>Rectify</strong> inaccurate data — edit your profile information at any time</li>
  <li><strong>Erase</strong> your data — use the "Delete Account" button on your profile page to permanently remove all your data</li>
  <li><strong>Portability</strong> — export your data in JSON format</li>
  <li><strong>Withdraw consent</strong> — delete your account at any time</li>
</ul>

<h2>Data Retention</h2>
<p>Your data is retained as long as your account is active. Upon account deletion, all associated data (profile, preferences, templates, saved reports) is permanently removed from our database.</p>

<h2>Data Security</h2>
<ul>
  <li>All data transmitted over HTTPS (TLS encryption in transit)</li>
  <li>Firestore data encrypted at rest by Google Cloud</li>
  <li>Row-level security rules ensure users can only access their own data</li>
  <li>No server-side logging of user activity</li>
</ul>

<h2>Children</h2>
<p>RadioLogicHQ is designed for medical professionals and is not intended for use by individuals under 16 years of age.</p>

<h2>Changes to This Policy</h2>
<p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>

<h2>Contact</h2>
<p>For questions about this privacy policy or your data, contact us at the email associated with the RadioLogicHQ project.</p>
`;
