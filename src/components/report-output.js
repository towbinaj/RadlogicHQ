import { copyToClipboard } from '../core/clipboard.js';
import { renderReport, renderBlocks } from '../core/report.js';
import { getStored, setStored } from '../core/storage.js';

/**
 * <report-output> Web Component
 * Displays generated report with:
 * - Editable report text (WYSIWYG — click to edit formatting directly)
 * - Template selector (PS360 / PS1 / RadAI)
 * - Copy to clipboard
 * - Block reorder + toggle panel
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
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="report-output">
        <div class="report-output__header">
          <h3>Report Output</h3>
          <div class="report-output__controls">
            <select class="report-output__selector" aria-label="Report template"></select>
            <button class="btn report-output__edit-btn">Edit</button>
            <button class="btn btn--primary report-output__copy-btn">Copy</button>
          </div>
        </div>
        <div class="report-output__text-wrap">
          <pre class="report-output__text"></pre>
        </div>
        <div class="report-output__edit-bar" hidden>
          <div class="edit-bar__row">
            <label class="edit-bar__points-toggle">
              <input type="checkbox" checked> Show points
            </label>
            <button class="btn edit-bar__reset-btn">Reset to Default</button>
            <button class="btn btn--primary edit-bar__done-btn">Done</button>
          </div>
          <p class="edit-bar__hint">Click the report text above to edit formatting. Drag ≡ to reorder. Uncheck to hide.</p>
        </div>
        <div class="report-output__toast" hidden>Copied!</div>
      </div>
    `;

    this._els = {
      selector: this.querySelector('.report-output__selector'),
      text: this.querySelector('.report-output__text'),
      copyBtn: this.querySelector('.report-output__copy-btn'),
      editBtn: this.querySelector('.report-output__edit-btn'),
      editBar: this.querySelector('.report-output__edit-bar'),
      pointsToggle: this.querySelector('.edit-bar__points-toggle input'),
      resetBtn: this.querySelector('.edit-bar__reset-btn'),
      doneBtn: this.querySelector('.edit-bar__done-btn'),
      toast: this.querySelector('.report-output__toast'),
    };

    this._els.selector.addEventListener('change', () => {
      this._activeTemplate = this._els.selector.value;
      this._loadBlockConfig();
      this._render();
    });

    this._els.copyBtn.addEventListener('click', () => this._copy());
    this._els.editBtn.addEventListener('click', () => this._toggleEdit());
    this._els.doneBtn.addEventListener('click', () => this._toggleEdit());
    this._els.resetBtn.addEventListener('click', () => this._resetTemplate());

    this._els.pointsToggle.addEventListener('change', () => {
      this._getConfig().showPoints = this._els.pointsToggle.checked;
      this._saveBlockConfig();
      this._render();
    });
  }

  set toolId(id) { this._toolId = id; }
  set renderFn(fn) { this._renderFn = fn; }
  set onReset(fn) { this._onReset = fn; }
  set onBlockReorder(fn) { this._onBlockReorder = fn; }

  setTemplates(templates) {
    this._templates = templates;
    const selector = this._els?.selector;
    if (!selector) return;

    selector.innerHTML = '';
    const ids = Object.keys(templates);
    for (const id of ids) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = templates[id].label;
      selector.appendChild(opt);
    }

    this._activeTemplate = ids[0] || '';
    this._loadBlockConfig();
    this._render();
  }

  updateReport(data) {
    this._templateData = data;
    this._render();
  }

  // --- Block config ---

  _getDefaultConfig() {
    const tmpl = this._templates[this._activeTemplate];
    if (!tmpl) return { blocks: [], showPoints: true, impression: null };
    return {
      blocks: tmpl.blocks.map((b) => ({ ...b })),
      showPoints: tmpl.showPoints ?? true,
      impression: tmpl.impression ? { ...tmpl.impression } : null,
    };
  }

  _getConfig() {
    if (!this._blockConfig) this._loadBlockConfig();
    return this._blockConfig;
  }

  _loadBlockConfig() {
    const key = `blockConfig:${this._toolId}:${this._activeTemplate}`;
    const saved = getStored(key);
    if (saved) {
      const defaults = this._getDefaultConfig();
      const savedIds = new Set(saved.blocks.map((b) => b.id));
      const merged = saved.blocks.map((sb) => {
        const def = defaults.blocks.find((d) => d.id === sb.id);
        if (!def) return sb;
        return {
          ...def,
          enabled: sb.enabled,
          showPoints: sb.showPoints ?? def.showPoints,
          template: sb.template ?? def.template,
          pointsTemplate: sb.pointsTemplate !== undefined ? sb.pointsTemplate : def.pointsTemplate,
        };
      });
      for (const db of defaults.blocks) {
        if (!savedIds.has(db.id)) merged.push({ ...db });
      }
      this._blockConfig = {
        blocks: merged,
        showPoints: saved.showPoints ?? defaults.showPoints,
        impression: defaults.impression,
      };
    } else {
      this._blockConfig = this._getDefaultConfig();
    }
  }

  _saveBlockConfig() {
    const key = `blockConfig:${this._toolId}:${this._activeTemplate}`;
    const config = this._getConfig();
    setStored(key, {
      blocks: config.blocks.map((b) => ({
        id: b.id,
        enabled: b.enabled,
        showPoints: b.showPoints,
        template: b.template,
        pointsTemplate: b.pointsTemplate,
      })),
      showPoints: config.showPoints,
    });
  }

  // --- Rendering ---

  _render() {
    if (!this._renderFn) {
      this._els.text.textContent = 'Select options above to generate report.';
      return;
    }

    if (this._editing) {
      this._renderEditableReport();
    } else {
      const config = this._getConfig();
      const text = this._renderFn(config, this._templateData);
      this._els.text.textContent = text;
      this._els.text.contentEditable = 'false';
    }
  }

  _renderEditableReport() {
    const pre = this._els.text;
    pre.innerHTML = '';
    pre.contentEditable = 'false';

    const config = this._getConfig();
    const showPoints = config.showPoints;

    // Render each block as an editable line
    config.blocks.forEach((block, index) => {
      const line = document.createElement('div');
      line.className = `editable-line ${block.enabled ? '' : 'editable-line--disabled'}`;
      line.dataset.blockIndex = index;

      // Drag handle
      const handle = document.createElement('span');
      handle.className = 'editable-line__handle';
      handle.textContent = '\u2261';
      handle.title = 'Drag to reorder';
      line.appendChild(handle);

      // Toggle checkbox
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = block.enabled;
      toggle.disabled = !!block.locked;
      toggle.className = 'editable-line__toggle';
      toggle.addEventListener('change', () => {
        block.enabled = toggle.checked;
        line.classList.toggle('editable-line--disabled', !block.enabled);
        this._saveBlockConfig();
        // Re-render the non-editing report for the renderFn
        this._renderFn && this._renderFn(config, this._templateData);
      });
      line.appendChild(toggle);

      // Editable text span
      const textSpan = document.createElement('span');
      textSpan.className = 'editable-line__text';
      textSpan.contentEditable = 'true';
      textSpan.spellcheck = false;

      // Render the current value
      let rendered = renderReport(block.template, this._templateData);
      if (block.pointsTemplate && block.showPoints && showPoints) {
        rendered += renderReport(block.pointsTemplate, this._templateData);
      }

      // If condition not met, show the template pattern dimmed
      if (block.condition && !this._templateData[block.condition]) {
        textSpan.textContent = block.label + ': (no data)';
        textSpan.classList.add('editable-line__text--empty');
      } else {
        textSpan.textContent = rendered || block.label;
      }

      // On blur, parse the edited text back into a template
      textSpan.addEventListener('blur', () => {
        const editedText = textSpan.textContent;
        const newTemplate = this._reverseTemplate(block, editedText, showPoints);
        if (newTemplate !== null) {
          block.template = newTemplate.template;
          if (newTemplate.pointsTemplate !== undefined) {
            block.pointsTemplate = newTemplate.pointsTemplate;
          }
          this._saveBlockConfig();
        }
      });

      line.appendChild(textSpan);

      // Drag handlers
      if (!block.locked) {
        line.draggable = true;
        line.addEventListener('dragstart', (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(index));
          line.classList.add('editable-line--dragging');
        });
        line.addEventListener('dragend', () => {
          line.classList.remove('editable-line--dragging');
          pre.querySelectorAll('.editable-line--dragover').forEach((l) => l.classList.remove('editable-line--dragover'));
        });
        line.addEventListener('dragover', (e) => {
          e.preventDefault();
          line.classList.add('editable-line--dragover');
        });
        line.addEventListener('dragleave', () => {
          line.classList.remove('editable-line--dragover');
        });
        line.addEventListener('drop', (e) => {
          e.preventDefault();
          line.classList.remove('editable-line--dragover');
          const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
          const to = index;
          if (from !== to) {
            const [moved] = config.blocks.splice(from, 1);
            config.blocks.splice(to, 0, moved);
            this._saveBlockConfig();
            this._renderEditableReport();
            // Notify parent of new block order (for syncing form sections)
            if (this._onBlockReorder) {
              const sectionIds = config.blocks.map((b) => b.id);
              this._onBlockReorder(sectionIds);
            }
          }
        });
      }

      pre.appendChild(line);
    });
  }

  /**
   * Reverse-engineer edited text back into a template.
   * Replaces the dynamic values with their {{variable}} placeholders.
   */
  _reverseTemplate(block, editedText, showPoints) {
    // Get the current data values to find what to replace
    const data = this._templateData;
    let template = editedText;
    let pointsTemplate = block.pointsTemplate;

    // Replace known data values with their template variables
    // Order matters: replace longer values first to avoid partial matches
    const replacements = this._getReplacements(data);
    for (const [value, variable] of replacements) {
      if (value && template.includes(value)) {
        template = template.replace(value, variable);
      }
    }

    // Try to split out points portion if it exists
    if (block.pointsTemplate && showPoints) {
      const renderedPoints = renderReport(block.pointsTemplate, data);
      if (renderedPoints && editedText.endsWith(renderedPoints)) {
        // Points part is at the end — check if user modified it
        const mainPart = editedText.slice(0, -renderedPoints.length);
        let pTemplate = editedText.slice(mainPart.length);
        for (const [value, variable] of replacements) {
          if (value && pTemplate.includes(value)) {
            pTemplate = pTemplate.replace(value, variable);
          }
        }
        template = mainPart;
        for (const [value, variable] of replacements) {
          if (value && template.includes(value)) {
            template = template.replace(value, variable);
          }
        }
        pointsTemplate = pTemplate;
      }
    }

    return { template, pointsTemplate };
  }

  _getReplacements(data) {
    // Build value→variable pairs, sorted by value length (longest first)
    const pairs = [];
    const varNames = [
      'noduleLabel', 'noduleLocation', 'noduleSize',
      'composition', 'compositionPoints',
      'echogenicity', 'echogenicityPoints',
      'shape', 'shapePoints',
      'margin', 'marginPoints',
      'echogenicFoci', 'echogenicFociPoints',
      'totalScore', 'tiradsFullLabel', 'tiradsName', 'tiradsLabel',
      'recommendation',
    ];
    for (const name of varNames) {
      const val = data[name];
      if (val != null && String(val) !== '') {
        pairs.push([String(val), `{{${name}}}`]);
      }
    }
    pairs.sort((a, b) => b[0].length - a[0].length);
    return pairs;
  }

  // --- Edit mode ---

  _toggleEdit() {
    this._editing = !this._editing;
    this._els.editBar.hidden = !this._editing;
    this._els.editBtn.textContent = this._editing ? 'Cancel' : 'Edit';

    if (this._editing) {
      this._els.pointsToggle.checked = this._getConfig().showPoints;
    }

    this._render();
  }

  // --- Actions ---

  async _copy() {
    // Always copy the plain text version
    const config = this._getConfig();
    const text = this._renderFn ? this._renderFn(config, this._templateData) : '';
    const success = await copyToClipboard(text);
    if (success) this._showToast();
  }

  _showToast() {
    const toast = this._els.toast;
    toast.hidden = false;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.hidden = true;
    }, 1500);
  }

  _resetTemplate() {
    const key = `blockConfig:${this._toolId}:${this._activeTemplate}`;
    localStorage.removeItem(`radtools:${key}`);
    this._blockConfig = null;
    this._loadBlockConfig();
    this._els.pointsToggle.checked = this._getConfig().showPoints;
    this._render();
    // Notify parent to reset section order
    if (this._onReset) this._onReset();
  }
}

customElements.define('report-output', ReportOutput);
