import { copyToClipboard } from '../core/clipboard.js';
import { getStored, setStored } from '../core/storage.js';

/**
 * <report-output> Web Component
 * Displays generated report text with template selector and copy button.
 *
 * Usage:
 *   const el = document.createElement('report-output');
 *   el.toolId = 'tirads';
 *   el.setTemplates(defaultTemplates);
 *   el.updateReport(templateData);
 */
export class ReportOutput extends HTMLElement {
  constructor() {
    super();
    this._toolId = '';
    this._templates = {};
    this._activeTemplate = '';
    this._templateData = {};
    this._renderFn = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="report-output">
        <div class="report-output__header">
          <h3>Report Output</h3>
          <div class="report-output__controls">
            <select class="report-output__selector" aria-label="Report template">
            </select>
            <button class="btn report-output__edit-btn" title="Edit template">Edit</button>
            <button class="btn btn--primary report-output__copy-btn" title="Copy to clipboard">
              Copy
            </button>
          </div>
        </div>
        <div class="report-output__text-wrap">
          <pre class="report-output__text"></pre>
        </div>
        <div class="report-output__editor" hidden>
          <textarea class="report-output__template-input" rows="15" spellcheck="false"></textarea>
          <div class="report-output__editor-actions">
            <button class="btn report-output__reset-btn">Reset to Default</button>
            <button class="btn btn--primary report-output__done-btn">Done</button>
          </div>
        </div>
        <div class="report-output__toast" hidden>Copied!</div>
      </div>
    `;

    this._els = {
      selector: this.querySelector('.report-output__selector'),
      text: this.querySelector('.report-output__text'),
      copyBtn: this.querySelector('.report-output__copy-btn'),
      editBtn: this.querySelector('.report-output__edit-btn'),
      editor: this.querySelector('.report-output__editor'),
      templateInput: this.querySelector('.report-output__template-input'),
      resetBtn: this.querySelector('.report-output__reset-btn'),
      doneBtn: this.querySelector('.report-output__done-btn'),
      toast: this.querySelector('.report-output__toast'),
    };

    this._els.selector.addEventListener('change', () => {
      this._activeTemplate = this._els.selector.value;
      this._render();
    });

    this._els.copyBtn.addEventListener('click', () => this._copy());
    this._els.editBtn.addEventListener('click', () => this._toggleEditor());
    this._els.resetBtn.addEventListener('click', () => this._resetTemplate());
    this._els.doneBtn.addEventListener('click', () => this._toggleEditor());

    this._els.templateInput.addEventListener('input', () => {
      this._saveCustomTemplate(this._els.templateInput.value);
      this._render();
    });
  }

  set toolId(id) {
    this._toolId = id;
  }

  /**
   * Set the render function used to produce report text.
   * @param {Function} fn - (templateStr, data) => string
   */
  set renderFn(fn) {
    this._renderFn = fn;
  }

  /**
   * Set available templates.
   * @param {Object} templates - { templateId: { label, template } }
   */
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
    this._render();
  }

  /**
   * Update report with new data.
   * @param {Object} data - Template data object
   */
  updateReport(data) {
    this._templateData = data;
    this._render();
  }

  _getActiveTemplateStr() {
    // Check for user-customized template
    const customKey = `templates:${this._toolId}:${this._activeTemplate}`;
    const custom = getStored(customKey);
    if (custom) return custom;

    return this._templates[this._activeTemplate]?.template || '';
  }

  _render() {
    const templateStr = this._getActiveTemplateStr();
    if (!this._renderFn || !templateStr) {
      this._els.text.textContent = 'Select options above to generate report.';
      return;
    }

    const text = this._renderFn(templateStr, this._templateData);
    this._els.text.textContent = text;

    // Update editor textarea if open
    if (!this._els.editor.hidden) {
      this._els.templateInput.value = templateStr;
    }
  }

  async _copy() {
    const text = this._els.text.textContent;
    const success = await copyToClipboard(text);
    if (success) {
      this._showToast();
    }
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

  _toggleEditor() {
    const editor = this._els.editor;
    const isHidden = editor.hidden;
    editor.hidden = !isHidden;

    if (!editor.hidden) {
      this._els.templateInput.value = this._getActiveTemplateStr();
      this._els.editBtn.textContent = 'Cancel';
    } else {
      this._els.editBtn.textContent = 'Edit';
    }
  }

  _saveCustomTemplate(templateStr) {
    const customKey = `templates:${this._toolId}:${this._activeTemplate}`;
    setStored(customKey, templateStr);
  }

  _resetTemplate() {
    const customKey = `templates:${this._toolId}:${this._activeTemplate}`;
    localStorage.removeItem(`radtools:${customKey}`);
    this._els.templateInput.value =
      this._templates[this._activeTemplate]?.template || '';
    this._render();
  }
}

customElements.define('report-output', ReportOutput);
