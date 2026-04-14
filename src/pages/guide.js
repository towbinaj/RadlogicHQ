import '../styles/base.css';
import '../styles/forms.css';
import '../components/auth-ui.js';
import '../components/feedback-widget.js';

document.getElementById('guide-content').innerHTML = `
<h1>User Guide</h1>

<nav class="guide-toc">
  <h3>Contents</h3>
  <ul>
    <li><a href="#quick-start">Quick Start</a></li>
    <li><a href="#selecting-tool">Finding & Selecting a Tool</a></li>
    <li><a href="#using-tool">Using a Tool</a></li>
    <li><a href="#report-output">Report Output</a></li>
    <li><a href="#templates">Report Templates</a></li>
    <li><a href="#pill-editor">Pill Editor (Customizing Reports)</a></li>
    <li><a href="#paste-parse">Paste & Parse</a></li>
    <li><a href="#keyboard">Keyboard Shortcuts</a></li>
    <li><a href="#favorites">Favorites & Hiding Tools</a></li>
    <li><a href="#preferences">Preferences</a></li>
    <li><a href="#account">Account & Data</a></li>
  </ul>
</nav>

<h2 id="quick-start">Quick Start</h2>
<ol>
  <li>Open a tool from the <a href="/">landing page</a> (search, filter by modality/body part/specialty, or click a favorite)</li>
  <li>Select findings or enter measurements in the left panel</li>
  <li>The report updates automatically in the right panel</li>
  <li>Click <strong>Copy</strong> to copy the report to your clipboard, then paste into your dictation system</li>
</ol>

<h2 id="selecting-tool">Finding & Selecting a Tool</h2>
<p>The <a href="/">landing page</a> shows all available tools as cards. Each card displays the tool name, a brief description, and labels for body part, modality, and specialty.</p>
<h3>Search</h3>
<p>Type in the search bar to filter tools by name or description. Filters combine — you can search while a modality filter is active.</p>
<h3>Dropdown Filters</h3>
<p>Use the <strong>Modality</strong>, <strong>Body Part</strong>, and <strong>Specialty</strong> dropdowns to narrow the list. Click <strong>Clear</strong> to reset all filters.</p>
<h3>Sort Order</h3>
<p>Use the sort dropdown (top-left) to order tools by A–Z, most recently used, most frequently used, or a custom drag-and-drop order.</p>

<h2 id="using-tool">Using a Tool</h2>
<p>Each tool page has a two-column layout:</p>
<ul>
  <li><strong>Left panel</strong> — input form with findings, measurements, and selectors</li>
  <li><strong>Right panel</strong> — live report output that updates as you make selections</li>
</ul>
<h3>Input Types</h3>
<ul>
  <li><strong>Toggle buttons</strong> (e.g., Right / Left / Bilateral) — click to select; click again to deselect</li>
  <li><strong>Option cards</strong> (e.g., TI-RADS composition) — click one to select; click another to change</li>
  <li><strong>Checkboxes / multi-select</strong> (e.g., AAST findings) — click multiple to select; click again to deselect</li>
  <li><strong>Number inputs</strong> (e.g., measurements) — type a value; results compute automatically</li>
  <li><strong>Dropdowns</strong> (e.g., vertebra selection) — select from the list</li>
</ul>
<h3>Summary Badges</h3>
<p>The badges in the top-right of each tool page show the key result (score, grade, category, percentage). They are color-coded by severity: <span style="color:var(--success);">green</span> = normal/low, <span style="color:var(--warning);">yellow</span> = moderate, <span style="color:var(--danger);">red</span> = severe/high.</p>
<h3>Multi-Item Tools</h3>
<p>Some tools (TI-RADS, Fleischner, LI-RADS) support multiple items (nodules, observations). Use the <strong>+</strong> button to add items, <strong>−</strong> to remove. Click tabs to switch between items. Double-click a tab to rename it.</p>
<h3>Mode Tabs</h3>
<p>Some tools have mode tabs (e.g., Curie/SIOPEN, UTD/SFU, Graf/AAOS). Click a tab to switch modes. Your preferred mode is saved automatically.</p>

<h2 id="report-output">Report Output</h2>
<p>The report panel shows a structured report that updates in real time as you select findings.</p>
<h3>Copy</h3>
<p>Click <strong>Copy</strong> (or press <kbd>Cmd+C</kbd> on Mac when the report is focused) to copy the report text to your clipboard. Paste it into PowerScribe, RadAI Omni, or any dictation system.</p>
<h3>Impression Toggle</h3>
<p>The <strong>Impression</strong> checkbox controls whether the IMPRESSION section appears in the report. Uncheck it to generate findings-only reports. This preference is saved across all tools.</p>
<h3>Template Selector</h3>
<p>Use the dropdown to switch between report formats:</p>
<ul>
  <li><strong>PowerScribe 360</strong> — standard structured report with FINDINGS / IMPRESSION headers</li>
  <li><strong>PowerScribe One</strong> — same structure, compatible with PS One</li>
  <li><strong>RadAI Omni</strong> — key-value format with [STRUCTURED REPORT] brackets</li>
</ul>
<p>Your default template can be set in <a href="/src/pages/profile.html">Preferences</a>.</p>

<h2 id="templates">Report Templates</h2>
<h3>Editing a Template</h3>
<p>Click <strong>Edit</strong> to enter the pill editor (see below). Click <strong>Done</strong> when finished. Your customizations are saved per tool and per template format.</p>
<h3>Exporting & Importing</h3>
<p>In edit mode, click <strong>Export</strong> to download the current template as a JSON file. Click <strong>Import</strong> to load a previously exported template. Supported import formats: JSON (RadioLogicHQ export), XML (PowerScribe AutoText), and plain text.</p>
<h3>Reset</h3>
<p>Click <strong>Reset</strong> in edit mode to restore the default template layout, removing all customizations for that tool and format.</p>
<h3>Undo / Redo</h3>
<p>In edit mode, use <strong>Undo</strong> and <strong>Redo</strong> buttons (or <kbd>Cmd+Z</kbd> / <kbd>Cmd+Shift+Z</kbd>) to step through editing changes.</p>

<h2 id="pill-editor">Pill Editor (Customizing Reports)</h2>
<p>The pill editor lets you fully customize how reports are structured and what data fields appear.</p>
<h3>How It Works</h3>
<ul>
  <li><strong>Pills</strong> (colored tokens) represent data fields — they automatically show the current value from the calculator</li>
  <li><strong>Free text</strong> — type around pills to add labels, headings, or custom wording</li>
  <li><strong>Palette</strong> — the panel below the editor shows available fields. Drag a pill from the palette into the report to add it</li>
</ul>
<h3>Pill Actions</h3>
<p>Click the gear icon on any pill to open its popover menu:</p>
<ul>
  <li><strong>Aliases</strong> — change the display text for each possible value (e.g., rename "Cystic or almost completely cystic" to "Cystic")</li>
  <li><strong>Custom options</strong> — add new value options to a field</li>
  <li><strong>Disable/Enable</strong> — hide a pill without removing it</li>
  <li><strong>Remove</strong> — delete a pill from the report</li>
</ul>
<h3>Custom Fields</h3>
<p>Click <strong>+ New field</strong> in the palette to create an entirely new data field. Give it a name, and it becomes a pill you can place in the report.</p>

<h2 id="paste-parse">Paste & Parse</h2>
<p>The <strong>Paste Findings</strong> panel at the bottom of each tool page lets you auto-fill the form from existing report text.</p>
<ol>
  <li>Paste report text (plain text, PowerScribe XML, or RadAI structured format) into the textarea</li>
  <li>Click <strong>Parse</strong></li>
  <li>The tool extracts recognized values and selects the corresponding options</li>
  <li>Unrecognized text goes into <strong>Additional Findings</strong></li>
</ol>
<p>Parsing accuracy depends on the tool — RADS tools with specific terminology parse most reliably.</p>

<h2 id="keyboard">Keyboard Shortcuts</h2>
<p>Tools with selectable options support keyboard shortcuts:</p>
<ul>
  <li><strong>Number keys (1–9)</strong> — select the corresponding option in the first unanswered section. Small number badges appear on each option.</li>
  <li><strong>Arrow keys (← →)</strong> — switch between tabs (nodules, observations, curves)</li>
</ul>

<h2 id="favorites">Favorites & Hiding Tools</h2>
<h3>Favorites</h3>
<p>Click the <strong>☆ star</strong> icon on any tool card to favorite it. Favorited tools float to the top of the landing page. Click the <strong>★ Favorites</strong> button in the filter bar to show only your favorites.</p>
<h3>Hiding Tools</h3>
<p>Click the <strong>eye icon</strong> on a tool card to hide it from the landing page. To unhide: click <strong>Show N hidden</strong> in the filter bar, then click the open-eye icon on the tool you want to restore. You can also unhide tools from the <a href="/src/pages/profile.html">Profile page</a>.</p>

<h2 id="preferences">Preferences</h2>
<p>Your preferences are saved in your browser and sync to your account when logged in. Set them in the <a href="/src/pages/profile.html">Profile page</a>:</p>
<ul>
  <li><strong>Default report template</strong> — choose PowerScribe 360, PowerScribe One, or RadAI Omni as the default across all tools</li>
  <li><strong>Default measurement unit</strong> — set mm or cm globally (individual tools can override)</li>
  <li><strong>Compact mode</strong> — hides reference images in tools to save screen space</li>
  <li><strong>MIBG scoring system</strong> — default to Curie or SIOPEN</li>
  <li><strong>Leg length mode</strong> — default to Total or Segmental</li>
</ul>
<p>Tool-specific preferences (hydronephrosis classification, hip dysplasia method, size units per tool) are set on each tool page and saved automatically.</p>

<h2 id="account">Account & Data</h2>
<h3>Signing Up</h3>
<p>Create an account with email/password or Google OAuth. An account lets you sync preferences, custom templates, and saved reports across devices.</p>
<h3>Without an Account</h3>
<p>All tools work without signing in. Preferences and templates save to your browser's local storage. They won't sync to other devices.</p>
<h3>Data Export</h3>
<p>From the <a href="/src/pages/profile.html">Profile page</a>, click <strong>Export All</strong> to download all your data (preferences, templates, saved reports) as JSON. Click <strong>Export Templates</strong> to export only your custom report templates (with selection dialog).</p>
<h3>Data Import</h3>
<p>Click <strong>Import</strong> on the Profile page to restore data from a previous export file.</p>
<h3>Account Deletion</h3>
<p>Click <strong>Delete Account</strong> to permanently remove your account and all associated data from our servers. This cannot be undone.</p>
<h3>Privacy</h3>
<p>RadioLogicHQ does not store any patient information. See our <a href="/src/pages/privacy.html">Privacy Policy</a> for details.</p>
`;

// Smooth scroll for TOC links
document.querySelectorAll('.guide-toc a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
