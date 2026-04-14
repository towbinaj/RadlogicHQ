import { copyToClipboard } from '../core/clipboard.js';
import { renderReport, renderBlocks } from '../core/report.js';
import { getStored, setStored, trackEvent } from '../core/storage.js';
import { isLoggedIn } from '../core/auth.js';
import { saveReport, getSavedReports, deleteSavedReport, shareTemplate } from '../core/user-data.js';
import {
  blocksToEditorContent, renderEditorContent, serializeDOM,
  deserializeToDOM, createPillSpan, getAvailablePills, normalizeContent,
} from '../core/pill-editor.js';

/**
 * HTML-escape a string so it is safe to interpolate into innerHTML.
 * Used for any user-controlled content that ends up in a template literal
 * assigned to .innerHTML. Do NOT rely on partial escapes.
 */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * <report-output> Web Component
 * Report display with pill-based WYSIWYG editor.
 */
export class ReportOutput extends HTMLElement {
  constructor() {
    super();
    this._toolId = '';
    this._templates = {};
    this._activeTemplate = '';
    this._templateData = {};
    this._renderFn = null;
    this._editing = false;
    this._popover = null;
    this._undoStack = [];
    this._redoStack = [];
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="report-output">
        <div class="report-output__header">
          <h3>Report Output</h3>
          <div class="report-output__controls">
            <select class="report-output__selector" aria-label="Report template"></select>
            <label class="report-output__impression-toggle" title="Show or hide the impression section">
              <input type="checkbox" checked> Impression
            </label>
            <input type="file" class="report-output__import-file" accept=".json,.xml,.txt" style="display:none">
            <button class="btn report-output__edit-btn">Edit</button>
            <button class="btn report-output__history-btn" style="display:none">History</button>
            <button class="btn btn--primary report-output__copy-btn">Copy</button>
          </div>
        </div>
        <div class="report-output__text-wrap">
          <pre class="report-output__text"></pre>
        </div>
        <div class="report-output__pill-palette" style="display:none"></div>
        <div class="report-output__edit-bar" style="display:none">
          <div class="edit-bar__row">
            <label class="edit-bar__points-toggle">
              <input type="checkbox" checked> Show points
            </label>
            <button class="btn edit-bar__undo-btn" disabled>Undo</button>
            <button class="btn edit-bar__redo-btn" disabled>Redo</button>
            <button class="btn report-output__export-tmpl-btn" title="Export this template">Export</button>
            <button class="btn report-output__import-tmpl-btn" title="Import a template">Import</button>
            <button class="btn edit-bar__save-btn" style="display:none">Save</button>
            <button class="btn edit-bar__share-btn" style="display:none">Share</button>
            <button class="btn edit-bar__reset-btn">Reset</button>
            <button class="btn btn--primary edit-bar__done-btn">Done</button>
          </div>
          <div class="edit-bar__share-result" style="display:none">
            <input type="text" class="edit-bar__share-url" readonly>
            <button class="btn edit-bar__share-copy">Copy Link</button>
          </div>
        </div>
        <div class="report-output__history-panel" style="display:none">
          <div class="history-panel__header">
            <span class="history-panel__title">Saved Reports</span>
            <button class="history-panel__close">&times;</button>
          </div>
          <div class="history-panel__list"></div>
          <div class="history-panel__empty">No saved reports yet.</div>
        </div>
        <div class="report-output__save-prompt" style="display:none">
          <input type="text" class="save-prompt__label" placeholder="Report label (optional)">
          <button class="btn btn--primary save-prompt__confirm">Save</button>
          <button class="btn save-prompt__cancel">Cancel</button>
        </div>
        <div class="report-output__phi-notice">Do not include patient-identifying information in reports.</div>
        <div class="report-output__toast" hidden>Copied!</div>
      </div>
    `;

    // Mobile floating "View Report" button
    const mobileBtn = document.createElement('button');
    mobileBtn.className = 'mobile-report-btn';
    mobileBtn.textContent = 'View Report';
    mobileBtn.addEventListener('click', () => {
      this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.body.appendChild(mobileBtn);

    this._els = {
      selector: this.querySelector('.report-output__selector'),
      text: this.querySelector('.report-output__text'),
      copyBtn: this.querySelector('.report-output__copy-btn'),
      impressionToggle: this.querySelector('.report-output__impression-toggle input'),
      exportTmplBtn: this.querySelector('.report-output__export-tmpl-btn'),
      importTmplBtn: this.querySelector('.report-output__import-tmpl-btn'),
      importTmplFile: this.querySelector('.report-output__import-file'),
      editBtn: this.querySelector('.report-output__edit-btn'),
      historyBtn: this.querySelector('.report-output__history-btn'),
      palette: this.querySelector('.report-output__pill-palette'),
      editBar: this.querySelector('.report-output__edit-bar'),
      pointsToggle: this.querySelector('.edit-bar__points-toggle input'),
      saveBtn: this.querySelector('.edit-bar__save-btn'),
      shareBtn: this.querySelector('.edit-bar__share-btn'),
      shareResult: this.querySelector('.edit-bar__share-result'),
      shareUrl: this.querySelector('.edit-bar__share-url'),
      shareCopy: this.querySelector('.edit-bar__share-copy'),
      undoBtn: this.querySelector('.edit-bar__undo-btn'),
      redoBtn: this.querySelector('.edit-bar__redo-btn'),
      resetBtn: this.querySelector('.edit-bar__reset-btn'),
      doneBtn: this.querySelector('.edit-bar__done-btn'),
      historyPanel: this.querySelector('.report-output__history-panel'),
      historyList: this.querySelector('.history-panel__list'),
      historyEmpty: this.querySelector('.history-panel__empty'),
      historyClose: this.querySelector('.history-panel__close'),
      savePrompt: this.querySelector('.report-output__save-prompt'),
      saveLabelInput: this.querySelector('.save-prompt__label'),
      saveConfirm: this.querySelector('.save-prompt__confirm'),
      saveCancel: this.querySelector('.save-prompt__cancel'),
      toast: this.querySelector('.report-output__toast'),
    };

    // Auth-dependent buttons
    import('../core/auth.js').then(({ onAuthChange }) => {
      onAuthChange((user) => {
        const show = user ? '' : 'none';
        this._els.historyBtn.style.display = show;
        this._els.saveBtn.style.display = show;
        this._els.shareBtn.style.display = show;
      });
    });

    // Template selector
    this._els.selector.addEventListener('change', () => {
      this._activeTemplate = this._els.selector.value;
      this._loadBlockConfig();
      this._render();
    });

    // Impression toggle
    this._showImpression = getStored('showImpression', true);
    this._els.impressionToggle.checked = this._showImpression;
    this._els.impressionToggle.addEventListener('change', () => {
      this._showImpression = this._els.impressionToggle.checked;
      setStored('showImpression', this._showImpression);
      this._render();
    });

    // Buttons
    this._els.copyBtn.addEventListener('click', () => this._copy());
    this._els.editBtn.addEventListener('click', () => this._toggleEdit());
    this._els.doneBtn.addEventListener('click', () => this._toggleEdit());
    this._els.resetBtn.addEventListener('click', () => this._resetTemplate());
    this._els.saveBtn.addEventListener('click', () => this._showSavePrompt());
    this._els.saveCancel.addEventListener('click', () => this._hideSavePrompt());
    this._els.saveConfirm.addEventListener('click', () => this._saveToHistory());
    this._els.historyBtn.addEventListener('click', () => this._toggleHistory());
    this._els.historyClose.addEventListener('click', () => this._closeHistory());
    this._els.shareBtn.addEventListener('click', () => this._shareTemplate());
    this._els.shareCopy.addEventListener('click', () => {
      copyToClipboard(this._els.shareUrl.value);
      this._showToast('Link copied!');
    });

    this._els.exportTmplBtn.addEventListener('click', () => this._exportTemplate());
    this._els.importTmplBtn.addEventListener('click', () => this._els.importTmplFile.click());
    this._els.importTmplFile.addEventListener('change', () => this._importTemplate());

    this._els.undoBtn.addEventListener('click', () => this._undo());
    this._els.redoBtn.addEventListener('click', () => this._redo());

    // Keyboard shortcuts for undo/redo
    this._keyHandler = (e) => {
      if (!this._editing) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this._undo();
      } else if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this._redo();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    this._els.pointsToggle.addEventListener('change', () => {
      this._pushUndo();
      this._getConfig().showPoints = this._els.pointsToggle.checked;
      this._saveBlockConfig();
      this._render();
    });
  }

  set toolId(id) { this._toolId = id; }
  set renderFn(fn) { this._renderFn = fn; }
  set onReset(fn) { this._onReset = fn; }
  set onBlockReorder(fn) { this._onBlockReorder = fn; }
  set definition(def) { this._definition = def; }

  setTemplates(templates) {
    this._templates = templates;
    const selector = this._els?.selector;
    if (!selector) return;
    selector.innerHTML = '';
    for (const [id, tmpl] of Object.entries(templates)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = tmpl.label;
      selector.appendChild(opt);
    }
    // Apply default template preference if available
    const defaultTmpl = getStored('defaultTemplate');
    this._activeTemplate = (defaultTmpl && templates[defaultTmpl]) ? defaultTmpl : (Object.keys(templates)[0] || '');
    if (selector.value !== this._activeTemplate) selector.value = this._activeTemplate;
    this._loadBlockConfig();
    this._render();
  }

  updateReport(data) {
    this._templateData = data;
    this._render();
  }

  // ===== Config Management =====

  _getDefaultConfig() {
    const tmpl = this._templates[this._activeTemplate];
    if (!tmpl) return { blocks: [], showPoints: true, impression: null, sectionHeaders: {}, customBlocks: [], editorContent: null, pillStates: {} };
    return {
      blocks: tmpl.blocks.map((b) => ({ ...b })),
      showPoints: tmpl.showPoints ?? true,
      impression: tmpl.impression ? { ...tmpl.impression } : null,
      sectionHeaders: { ...(tmpl.sectionHeaders || {}) },
      customBlocks: [],
      editorContent: null,
      pillStates: {},
    };
  }

  _getConfig() {
    if (!this._blockConfig) this._loadBlockConfig();
    // Override impression enabled based on toggle
    if (this._blockConfig?.impression) {
      this._blockConfig.impression.enabled = this._showImpression;
    }
    return this._blockConfig;
  }

  _loadBlockConfig() {
    const key = `blockConfig:${this._toolId}:${this._activeTemplate}`;
    const saved = getStored(key);
    if (saved) {
      const defaults = this._getDefaultConfig();
      const savedIds = new Set((saved.blocks || []).map((b) => b.id));
      const merged = (saved.blocks || []).map((sb) => {
        const def = defaults.blocks.find((d) => d.id === sb.id);
        if (!def) return sb;
        return { ...def, enabled: sb.enabled, showPoints: sb.showPoints ?? def.showPoints, template: sb.template ?? def.template, pointsTemplate: sb.pointsTemplate !== undefined ? sb.pointsTemplate : def.pointsTemplate };
      });
      for (const db of defaults.blocks) {
        if (!savedIds.has(db.id)) merged.push({ ...db });
      }
      this._blockConfig = {
        blocks: merged,
        showPoints: saved.showPoints ?? defaults.showPoints,
        impression: defaults.impression,
        sectionHeaders: saved.sectionHeaders ?? defaults.sectionHeaders,
        customBlocks: saved.customBlocks ?? [],
        editorContent: saved.editorContent ?? null,
        pillStates: saved.pillStates ?? {},
      };
    } else {
      this._blockConfig = this._getDefaultConfig();
    }
  }

  _saveBlockConfig() {
    const key = `blockConfig:${this._toolId}:${this._activeTemplate}`;
    const c = this._getConfig();
    setStored(key, {
      blocks: c.blocks.map((b) => ({ id: b.id, enabled: b.enabled, showPoints: b.showPoints, template: b.template, pointsTemplate: b.pointsTemplate })),
      showPoints: c.showPoints,
      sectionHeaders: c.sectionHeaders,
      customBlocks: c.customBlocks,
      editorContent: c.editorContent,
      pillStates: c.pillStates,
    });
  }

  // ===== Rendering =====

  _render() {
    if (!this._renderFn) {
      this._els.text.textContent = 'Select options above to generate report.';
      this._els.text.className = 'report-output__text report-output__text--empty';
      return;
    }

    if (this._editing) {
      this._renderPillEditor();
    } else {
      const config = this._getConfig();
      const text = this._renderFn(config, this._templateData);
      this._els.text.textContent = text;
      this._els.text.contentEditable = 'false';
      this._els.text.className = 'report-output__text';
    }
  }

  // ===== Pill Editor =====

  _renderPillEditor() {
    const pre = this._els.text;
    const config = this._getConfig();

    // Migrate if no editorContent yet
    if (!config.editorContent) {
      config.editorContent = blocksToEditorContent(config);
      this._saveBlockConfig();
    }

    // Tear down previous listeners
    if (this._editorAbort) this._editorAbort.abort();
    this._editorAbort = new AbortController();
    const signal = this._editorAbort.signal;

    // Render as pill editor
    pre.innerHTML = '';
    pre.className = 'report-output__text pill-editor';
    pre.contentEditable = 'true';
    pre.spellcheck = false;

    const fragment = deserializeToDOM(config.editorContent, config.pillStates, this._templateData);
    pre.appendChild(fragment);

    // Debounced save on input
    let saveTimer;
    let undoPushed = false;
    pre.addEventListener('input', () => {
      if (!undoPushed) { this._pushUndo(); undoPushed = true; }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        config.editorContent = serializeDOM(pre);
        this._saveBlockConfig();
        undoPushed = false;
      }, 500);
    }, { signal });

    // Pill gear click → popover (only on right side of pill where gear icon is)
    pre.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (pill) {
        const rect = pill.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        // Only open popover if clicking on the right 20px (gear area)
        if (clickX > rect.width - 20) {
          e.preventDefault();
          e.stopPropagation();
          this._showPillPopover(pill, config);
        }
      }
    }, { signal });

    // Drop from palette
    pre.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }, { signal });

    pre.addEventListener('drop', (e) => {
      const blockId = e.dataTransfer.getData('application/pill-block-id');
      if (!blockId) return;
      e.preventDefault();
      this._pushUndo();

      // Insert pill at drop position
      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
      }

      if (range) {
        const display = e.dataTransfer.getData('application/pill-display') || `{{${blockId}}}`;
        const pill = createPillSpan(blockId, display, this._templateData, false);
        const zws = document.createTextNode('\u200B');
        range.insertNode(zws);
        range.insertNode(pill);
        range.insertNode(document.createTextNode('\u200B'));

        // Serialize and save
        config.editorContent = serializeDOM(pre);
        this._saveBlockConfig();
        this._renderPalette(config);
      }
    }, { signal });

    // Render palette
    this._renderPalette(config);
  }

  _renderPalette(config) {
    const palette = this._els.palette;
    const available = getAvailablePills(config.blocks, config.editorContent || []);

    // Also add impression/summary pills
    const allAvailable = [...available];
    const placedIds = new Set((config.editorContent || []).filter((n) => n.type === 'pill').map((n) => n.blockId));

    // Add impression variables if not placed
    if (config.impression?.template) {
      const impVars = config.impression.template.match(/\{\{(\w+)\}\}/g) || [];
      for (const v of impVars) {
        const id = v.replace(/\{\{|\}\}/g, '');
        if (!placedIds.has(id) && !allAvailable.find((a) => a.blockId === id)) {
          allAvailable.push({ blockId: id, label: id, display: v, category: 'meta' });
        }
      }
    }

    if (allAvailable.length === 0 && placedIds.size > 0) {
      palette.innerHTML = '<div class="pill-palette__title">All fields placed</div><div class="pill-palette__group"><button class="pill-palette__add-field">+ New field</button></div>';
    } else {
      const findings = allAvailable.filter((p) => p.category === 'finding');
      const scores = allAvailable.filter((p) => p.category === 'score');
      const meta = allAvailable.filter((p) => p.category === 'meta');

      let html = '<div class="pill-palette__title">Drag fields into the report</div>';

      const renderGroup = (title, items) => {
        if (items.length === 0) return '';
        let h = `<div class="pill-palette__group"><div class="pill-palette__group-title">${title}</div><div class="pill-palette__items">`;
        for (const item of items) {
          const value = this._templateData ? renderReport(item.display, this._templateData) : '';
          const truncValue = value.length > 20 ? value.substring(0, 17) + '...' : value;
          h += `<div class="pill-palette__item" draggable="true" data-block-id="${escapeHtml(item.blockId)}" data-display="${escapeHtml(item.display)}">
            <span class="pill-palette__item-label">${escapeHtml(item.label)}</span>
            ${truncValue ? `<span class="pill-palette__item-value">${escapeHtml(truncValue)}</span>` : ''}
          </div>`;
        }
        h += '</div></div>';
        return h;
      };

      html += renderGroup('Findings', findings);
      html += renderGroup('Scores', scores);
      html += renderGroup('Other', meta);

      // Add custom field button
      html += `<div class="pill-palette__group"><button class="pill-palette__add-field">+ New field</button></div>`;

      palette.innerHTML = html;
    }

    // Wire palette drag
    palette.querySelectorAll('.pill-palette__item').forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/pill-block-id', item.dataset.blockId);
        e.dataTransfer.setData('application/pill-display', item.dataset.display);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    // Wire new field button
    const addFieldBtn = palette.querySelector('.pill-palette__add-field');
    if (addFieldBtn) {
      addFieldBtn.addEventListener('click', () => {
        const name = prompt('Field name (e.g., "Vascularity"):');
        if (!name?.trim()) return;
        this._pushUndo();

        const fieldId = `custom_${name.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        const display = `{{${fieldId}}}`;

        // Add to editorContent as a new pill at the end
        if (!config.editorContent) config.editorContent = [];
        config.editorContent.push({ type: 'text', value: '\n' + name.trim() + ': ' });
        config.editorContent.push({ type: 'pill', blockId: fieldId, display });

        // Initialize pill state with one default option
        if (!config.pillStates[fieldId]) {
          config.pillStates[fieldId] = {
            enabled: true,
            aliases: { 'default': name.trim() },
            customOptions: [{ id: 'default', label: name.trim() }],
          };
        }

        this._saveBlockConfig();
        this._renderPillEditor();
      });
    }
  }

  _showPillPopover(pillEl, config) {
    this._closePillPopover();

    const popover = document.createElement('div');
    popover.className = 'pill-popover';

    const blockId = pillEl.dataset.blockId;
    const isDisabled = config.pillStates[blockId]?.enabled === false;

    // Find the section/block that this pill belongs to for value aliases
    const section = this._findSectionForPill(blockId);
    if (!config.pillStates[blockId]) config.pillStates[blockId] = {};
    const aliases = config.pillStates[blockId].aliases || {};

    let html = '<div class="pill-popover__content">';

    // Custom options stored per pill
    const customOptions = config.pillStates[blockId].customOptions || [];

    // If this pill maps to a section with options, show alias editor
    if (section?.options || customOptions.length > 0) {
      const allOptions = [...(section?.options || []), ...customOptions.map((co) => ({ id: co.id, label: co.label, custom: true }))];
      html += '<div class="pill-popover__aliases">';
      html += `<div class="pill-popover__aliases-title">${escapeHtml(section?.label || blockId)} display text</div>`;
      for (const opt of allOptions) {
        const alias = aliases[opt.id] ?? opt.label;
        const escaped = alias.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<div class="pill-popover__alias-row">
          <textarea class="pill-popover__alias-input" data-option-id="${opt.id}" rows="1" spellcheck="false">${escaped}</textarea>
          ${opt.custom ? `<button class="pill-popover__btn pill-popover__btn--danger pill-popover__delete-opt" data-custom-id="${opt.id}" title="Remove">&times;</button>` : ''}
        </div>`;
      }
      html += `<button class="pill-popover__btn pill-popover__add-opt" data-action="add-option">+ Add option</button>`;
      html += '</div>';
    }

    html += `<div class="pill-popover__actions">
      <button class="pill-popover__btn" data-action="toggle">${isDisabled ? 'Enable' : 'Disable'}</button>
      <button class="pill-popover__btn pill-popover__btn--danger" data-action="remove">Remove</button>
    </div></div>`;

    popover.innerHTML = html;

    // Position near the pill
    const rect = pillEl.getBoundingClientRect();
    const containerRect = this._els.text.getBoundingClientRect();
    popover.style.left = `${Math.max(0, rect.left - containerRect.left)}px`;
    popover.style.top = `${rect.bottom - containerRect.top + 4}px`;

    // Alias input handlers
    let aliasUndoPushed = false;
    popover.querySelectorAll('.pill-popover__alias-input').forEach((input) => {
      input.addEventListener('input', () => {
        if (!aliasUndoPushed) { this._pushUndo(); aliasUndoPushed = true; }
        if (!config.pillStates[blockId].aliases) config.pillStates[blockId].aliases = {};
        config.pillStates[blockId].aliases[input.dataset.optionId] = input.value;
        this._saveBlockConfig();
        // Update the pill's display text to reflect the alias for the current value
        this._updatePillDisplay(pillEl, blockId, config);
      });
      input.addEventListener('blur', () => { aliasUndoPushed = false; });
    });

    // Add custom option
    const addOptBtn = popover.querySelector('[data-action="add-option"]');
    if (addOptBtn) {
      addOptBtn.addEventListener('click', () => {
        this._pushUndo();
        if (!config.pillStates[blockId].customOptions) config.pillStates[blockId].customOptions = [];
        const newId = `custom_${Date.now()}`;
        config.pillStates[blockId].customOptions.push({ id: newId, label: 'New option' });
        if (!config.pillStates[blockId].aliases) config.pillStates[blockId].aliases = {};
        config.pillStates[blockId].aliases[newId] = 'New option';
        this._saveBlockConfig();
        // Re-open popover to show new option
        this._showPillPopover(pillEl, config);
      });
    }

    // Delete custom option
    popover.querySelectorAll('.pill-popover__delete-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._pushUndo();
        const customId = btn.dataset.customId;
        const opts = config.pillStates[blockId].customOptions || [];
        config.pillStates[blockId].customOptions = opts.filter((o) => o.id !== customId);
        if (config.pillStates[blockId].aliases) delete config.pillStates[blockId].aliases[customId];
        this._saveBlockConfig();
        this._showPillPopover(pillEl, config);
      });
    });

    popover.querySelector('[data-action="toggle"]').addEventListener('click', () => {
      this._pushUndo();
      config.pillStates[blockId].enabled = isDisabled;
      pillEl.classList.toggle('pill--disabled', !isDisabled);
      this._saveBlockConfig();
      this._closePillPopover();
    });

    popover.querySelector('[data-action="remove"]').addEventListener('click', () => {
      this._pushUndo();
      pillEl.remove();
      config.editorContent = serializeDOM(this._els.text);
      this._saveBlockConfig();
      this._renderPalette(config);
      this._closePillPopover();
    });

    this._els.text.style.position = 'relative';
    this._els.text.appendChild(popover);
    this._popover = popover;

    // Close on click outside
    const closeHandler = (e) => {
      if (!popover.contains(e.target) && e.target !== pillEl) {
        this._closePillPopover();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  _closePillPopover() {
    if (this._popover) {
      this._popover.remove();
      this._popover = null;
    }
  }

  _findSectionForPill(blockId) {
    if (!this._definition) return null;

    // Map pill variable names to definition input IDs
    const variableToInputMap = {
      'noduleLocation': 'nodule-side',
      'noduleSize': 'nodule-size',
      'location': 'location',
    };
    const inputId = variableToInputMap[blockId] || blockId;

    // Check scored sections
    for (const s of this._definition.sections || []) {
      if (s.id === inputId || s.id === blockId) return s;
    }
    // Check primary inputs
    for (const p of this._definition.primaryInputs || []) {
      if (p.id === inputId || p.id === blockId) {
        if (p.options) return p;
      }
    }
    // Check major features (LI-RADS)
    for (const f of this._definition.majorFeatures || []) {
      if (f.id === inputId || f.id === blockId) return f;
    }
    // Check location input (LI-RADS)
    if (this._definition.locationInput) {
      const loc = this._definition.locationInput;
      if (loc.id === inputId || loc.id === blockId) return loc;
    }
    return null;
  }

  _updatePillDisplay(pillEl, blockId, config) {
    const aliases = config.pillStates[blockId]?.aliases;
    if (!aliases || !this._templateData) return;

    // Find the current value from templateData
    const currentValue = this._templateData[blockId];
    if (!currentValue) return;

    // Find which option matches the current value
    const section = this._findSectionForPill(blockId);
    if (!section?.options) return;

    const matchedOpt = section.options.find((o) => o.label === currentValue || o.id === currentValue);
    if (matchedOpt && aliases[matchedOpt.id]) {
      pillEl.textContent = aliases[matchedOpt.id];
    }
  }

  // ===== Undo / Redo =====

  _pushUndo() {
    const snapshot = JSON.parse(JSON.stringify(this._blockConfig));
    this._undoStack.push(snapshot);
    if (this._undoStack.length > 50) this._undoStack.shift();
    this._redoStack.length = 0;
    this._updateUndoButtons();
  }

  _undo() {
    if (this._undoStack.length === 0) return;
    // Save current state to redo stack
    this._redoStack.push(JSON.parse(JSON.stringify(this._blockConfig)));
    this._blockConfig = this._undoStack.pop();
    this._saveBlockConfig();
    this._updateUndoButtons();
    this._render();
  }

  _redo() {
    if (this._redoStack.length === 0) return;
    this._undoStack.push(JSON.parse(JSON.stringify(this._blockConfig)));
    this._blockConfig = this._redoStack.pop();
    this._saveBlockConfig();
    this._updateUndoButtons();
    this._render();
  }

  _updateUndoButtons() {
    if (this._els?.undoBtn) this._els.undoBtn.disabled = this._undoStack.length === 0;
    if (this._els?.redoBtn) this._els.redoBtn.disabled = this._redoStack.length === 0;
  }

  // ===== Edit Mode Toggle =====

  _toggleEdit() {
    this._editing = !this._editing;
    this._els.editBar.style.display = this._editing ? '' : 'none';
    this._els.palette.style.display = this._editing ? '' : 'none';
    this._els.editBtn.textContent = this._editing ? 'Cancel' : 'Edit';

    if (this._editing) {
      const config = this._getConfig();
      this._els.pointsToggle.checked = config.showPoints;
      // Hide points toggle if no blocks have pointsTemplate
      const hasPoints = (config.blocks || []).some((b) => b.pointsTemplate);
      this._els.pointsToggle.closest('label').style.display = hasPoints ? '' : 'none';
    } else {
      // Leaving edit mode — serialize final state
      const config = this._getConfig();
      if (config.editorContent) {
        config.editorContent = serializeDOM(this._els.text);
        this._saveBlockConfig();
      }
      this._closePillPopover();
    }

    this._render();
  }

  // ===== Copy =====

  async _copy() {
    const config = this._getConfig();
    let text;

    if (config.editorContent) {
      // Use editorContent for plain text rendering
      text = renderEditorContent(config.editorContent, config.pillStates, this._templateData);
    } else if (this._renderFn) {
      text = this._renderFn(config, this._templateData);
    } else {
      text = '';
    }

    const success = await copyToClipboard(text);
    if (success) {
      this._showToast();
      trackEvent(`tool:${this._toolId}:reports`);
      trackEvent(`template:${this._activeTemplate}:uses`);
    }
  }

  // ===== Reset =====

  _resetTemplate() {
    const key = `blockConfig:${this._toolId}:${this._activeTemplate}`;
    import('../core/storage.js').then(({ removeStored }) => removeStored(key));
    this._blockConfig = null;
    this._undoStack.length = 0;
    this._redoStack.length = 0;
    this._updateUndoButtons();
    this._loadBlockConfig();
    this._els.pointsToggle.checked = this._getConfig().showPoints;
    this._render();
    if (this._onReset) this._onReset();
  }

  // ===== Save to History =====

  _showSavePrompt() {
    this._els.savePrompt.style.display = 'flex';
    this._els.saveLabelInput.value = '';
    this._els.saveLabelInput.focus();
  }

  _hideSavePrompt() { this._els.savePrompt.style.display = 'none'; }

  async _saveToHistory() {
    const config = this._getConfig();
    const text = config.editorContent
      ? renderEditorContent(config.editorContent, config.pillStates, this._templateData)
      : (this._renderFn ? this._renderFn(config, this._templateData) : '');
    if (!text) return;
    const label = this._els.saveLabelInput.value.trim() || `${this._toolId} report`;
    await saveReport(this._toolId, text, label);
    this._hideSavePrompt();
    this._showToast('Saved!');
  }

  // ===== History =====

  async _toggleHistory() {
    const panel = this._els.historyPanel;
    if (panel.style.display !== 'none') { this._closeHistory(); return; }
    panel.style.display = '';
    this._els.historyList.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:0.75rem;">Loading...</div>';
    this._els.historyEmpty.style.display = 'none';
    const reports = await getSavedReports(this._toolId);
    this._els.historyList.innerHTML = '';
    if (reports.length === 0) { this._els.historyEmpty.style.display = ''; return; }
    this._els.historyEmpty.style.display = 'none';
    for (const report of reports) {
      const row = document.createElement('div');
      row.className = 'history-item';
      const preview = report.reportText.substring(0, 80).replace(/\n/g, ' ');
      row.innerHTML = `
        <div class="history-item__info">
          <span class="history-item__label">${report.label}</span>
          <span class="history-item__preview">${preview}...</span>
        </div>
        <div class="history-item__actions">
          <button class="btn history-item__load">Load</button>
          <button class="btn history-item__delete">&times;</button>
        </div>`;
      row.querySelector('.history-item__load').addEventListener('click', () => {
        this._els.text.textContent = report.reportText;
        this._closeHistory();
      });
      row.querySelector('.history-item__delete').addEventListener('click', async () => {
        await deleteSavedReport(report.id);
        row.remove();
        if (this._els.historyList.children.length === 0) this._els.historyEmpty.style.display = '';
      });
      this._els.historyList.appendChild(row);
    }
  }

  _closeHistory() { this._els.historyPanel.style.display = 'none'; }

  // ===== Share =====

  async _shareTemplate() {
    const code = await shareTemplate(this._toolId, this._activeTemplate);
    if (!code) { this._showToast('Save a custom template first'); return; }
    this._els.shareUrl.value = `${window.location.origin}/?share=${code}`;
    this._els.shareResult.style.display = 'flex';
  }

  // ===== Toast =====

  _exportTemplate() {
    const config = this._getConfig();
    if (!config) return;
    const data = {
      type: 'radiologichq-template',
      toolId: this._toolId,
      templateId: this._activeTemplate,
      config: JSON.parse(JSON.stringify(config)),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this._toolId}-${this._activeTemplate}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
    this._showToast('Template exported!');
  }

  _importTemplate() {
    const file = this._els.importTmplFile.files[0];
    this._els.importTmplFile.value = '';
    if (!file) return;
    file.text().then((text) => {
      const trimmed = text.trim();

      // Detect XML (PowerScribe AutoText export or plain XML)
      if (trimmed.startsWith('<')) {
        this._importFromXML(trimmed);
        return;
      }

      // Detect plain text (not JSON)
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        this._importFromText(trimmed);
        return;
      }

      try {
        const data = JSON.parse(text);

        // Support both single-tool and multi-tool export formats
        if (data.type === 'radiologichq-templates' && Array.isArray(data.templates)) {
          // Multi-tool export — only import templates matching this tool
          const matching = data.templates.filter((t) => t.toolId === this._toolId);
          if (matching.length === 0) {
            this._showToast('No templates for this tool');
            return;
          }
          for (const tmpl of matching) {
            setStored(`blockConfig:${tmpl.toolId}:${tmpl.templateId}`, tmpl.config);
          }
          this._loadBlockConfig();
          this._render();
          this._showToast(`Imported ${matching.length} template(s)!`);
          return;
        }

        // Single-tool export
        if (!data.config || !data.toolId) {
          this._showToast('Invalid template file');
          return;
        }
        if (data.toolId !== this._toolId) {
          if (!confirm(`This template is for ${data.toolId}. Import anyway into ${this._toolId}?`)) return;
        }
        const templateId = data.templateId || this._activeTemplate;
        setStored(`blockConfig:${this._toolId}:${templateId}`, data.config);
        this._loadBlockConfig();
        this._render();
        this._showToast('Template imported!');
      } catch {
        this._showToast('Invalid file');
      }
    });
  }

  _importFromXML(xml) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      if (doc.querySelector('parsererror')) {
        this._showToast('Invalid XML file');
        return;
      }
      // Extract ContentText from PowerScribe AutoText export
      const contentEls = doc.querySelectorAll('ContentText');
      if (contentEls.length === 0) {
        // Fallback: try all text content
        const allText = doc.documentElement.textContent.trim();
        if (!allText) { this._showToast('No text found in XML'); return; }
        this._importFromText(allText);
        return;
      }
      // If multiple AutoTexts, let user pick or use the first
      const texts = [...contentEls].map((el) => el.textContent.trim()).filter(Boolean);
      if (texts.length === 0) { this._showToast('Empty ContentText in XML'); return; }
      // Use first ContentText (most common: single AutoText export)
      this._importFromText(texts[0]);
    } catch {
      this._showToast('Could not parse XML');
    }
  }

  _importFromText(reportText) {
    if (!reportText.trim()) { this._showToast('Empty report text'); return; }

    const config = this._getConfig();
    this._pushUndo();

    // Detect RadAI-style structured format: [STRUCTURED REPORT] ... Key: Value ... [END STRUCTURED REPORT]
    const radaiMatch = reportText.match(/\[STRUCTURED REPORT\]([\s\S]*?)(?:\[END STRUCTURED REPORT\]|$)/i);
    if (radaiMatch) {
      const structuredBody = radaiMatch[1].trim();
      const content = [];
      const lines = structuredBody.split('\n');

      for (const line of lines) {
        const trimLine = line.trim();
        if (!trimLine) continue;

        // Detect section headers like [IMPRESSION], [FINDINGS], [OTHER FINDINGS]
        if (/^\[.+\]$/.test(trimLine)) {
          content.push({ type: 'text', value: '\n' + trimLine + '\n' });
          continue;
        }

        // Detect Key: Value pairs (e.g., "Composition: Solid")
        const kvMatch = trimLine.match(/^([A-Za-z_][A-Za-z0-9_ ]*?):\s*(.+)$/);
        if (kvMatch) {
          const key = kvMatch[1].trim();
          const value = kvMatch[2].trim();
          // Create as pill-ready text: label + value on same line
          content.push({ type: 'text', value: key + ': ' + value + '\n' });
        } else {
          content.push({ type: 'text', value: trimLine + '\n' });
        }
      }

      // Also capture any text outside the structured block (e.g., impression)
      const afterBlock = reportText.replace(/\[STRUCTURED REPORT\][\s\S]*?(?:\[END STRUCTURED REPORT\]|$)/i, '').trim();
      if (afterBlock) {
        content.push({ type: 'text', value: '\n' + afterBlock });
      }

      config.editorContent = content.length > 0 ? content : [{ type: 'text', value: reportText.trim() }];
    } else {
      // Plain text — convert to single text node
      config.editorContent = [{ type: 'text', value: reportText.trim() }];
    }

    this._saveBlockConfig();
    this._render();
    this._showToast('Report template imported — edit to add data fields');
  }

  _showToast(msg = 'Copied!') {
    const toast = this._els.toast;
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); toast.hidden = true; }, 1500);
  }
}

customElements.define('report-output', ReportOutput);
