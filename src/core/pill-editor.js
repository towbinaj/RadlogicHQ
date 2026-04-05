/**
 * Pill editor data model and serialization.
 * Pure logic — no DOM dependencies except serialize/deserialize.
 */
import { renderReport } from './report.js';

// Zero-width space used to give cursor a landing spot around pills
const ZWS = '\u200B';

/**
 * Migrate a block-based template config into editorContent format.
 * Called on first edit when no editorContent exists.
 */
export function blocksToEditorContent(config) {
  const content = [];
  const headers = config.sectionHeaders || {};

  // Findings header
  content.push({ type: 'text', value: (headers.findings || 'FINDINGS:') + '\n' });

  // Convert each block to text + pill nodes
  for (const block of config.blocks || []) {
    if (!block.enabled && !block.locked) continue;

    // Parse template to extract text and {{variable}} parts
    const parts = parseTemplate(block.template);
    for (const part of parts) {
      if (part.type === 'variable') {
        content.push({ type: 'pill', blockId: part.variable, display: `{{${part.variable}}}` });
      } else {
        content.push({ type: 'text', value: part.value });
      }
    }

    // Add points if applicable
    if (block.pointsTemplate && block.showPoints) {
      const pointParts = parseTemplate(block.pointsTemplate);
      for (const part of pointParts) {
        if (part.type === 'variable') {
          content.push({ type: 'pill', blockId: part.variable, display: `{{${part.variable}}}` });
        } else {
          content.push({ type: 'text', value: part.value });
        }
      }
    }

    content.push({ type: 'text', value: '\n' });
  }

  // Custom blocks
  for (const cb of config.customBlocks || []) {
    content.push({ type: 'text', value: cb.text + '\n' });
  }

  // Impression
  content.push({ type: 'text', value: '\n' + (headers.impression || 'IMPRESSION:') + '\n' });
  if (config.impression?.template) {
    const impParts = parseTemplate(config.impression.template);
    for (const part of impParts) {
      if (part.type === 'variable') {
        content.push({ type: 'pill', blockId: part.variable, display: `{{${part.variable}}}` });
      } else {
        content.push({ type: 'text', value: part.value });
      }
    }
  }

  return normalizeContent(content);
}

/**
 * Render editorContent to plain text by substituting pill values.
 * Applies display aliases from pillStates when available.
 * @param {Array} content - editorContent array
 * @param {Object} pillStates - per-pill state including aliases
 * @param {Object} templateData - current template data with values
 * @param {Object} [definition] - tool definition for alias resolution
 */
export function renderEditorContent(content, pillStates, templateData, definition) {
  let result = '';
  for (const node of content) {
    if (node.type === 'text') {
      result += node.value;
    } else if (node.type === 'pill') {
      const state = pillStates?.[node.blockId];
      if (state?.enabled === false) continue;

      // Check for display alias
      const aliased = resolveAlias(node.blockId, state, templateData, definition);
      if (aliased != null) {
        result += aliased;
      } else {
        result += renderReport(node.display, templateData);
      }
    }
  }
  // Clean up excessive newlines
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Serialize a contentEditable DOM into editorContent array.
 */
export function serializeDOM(container) {
  const content = [];

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\u200B/g, ''); // strip ZWS
      if (text) content.push({ type: 'text', value: text });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList?.contains('pill')) {
        content.push({
          type: 'pill',
          blockId: node.dataset.blockId,
          display: node.dataset.display || `{{${node.dataset.blockId}}}`,
        });
      } else if (node.tagName === 'BR') {
        content.push({ type: 'text', value: '\n' });
      } else {
        // Recurse into children (div, span, etc.)
        for (const child of node.childNodes) {
          walk(child);
        }
        // ContentEditable divs act as line breaks
        if (node.tagName === 'DIV' && node !== container) {
          content.push({ type: 'text', value: '\n' });
        }
      }
    }
  }

  walk(container);
  return normalizeContent(content);
}

/**
 * Deserialize editorContent into DOM nodes for a contentEditable container.
 */
export function deserializeToDOM(content, pillStates, templateData) {
  const fragment = document.createDocumentFragment();

  for (const node of content) {
    if (node.type === 'text') {
      // Split on newlines to create text + <br> pairs
      const lines = node.value.split('\n');
      lines.forEach((line, i) => {
        if (line) fragment.appendChild(document.createTextNode(line));
        if (i < lines.length - 1) fragment.appendChild(document.createElement('br'));
      });
    } else if (node.type === 'pill') {
      const disabled = pillStates?.[node.blockId]?.enabled === false;
      const pill = createPillSpan(node.blockId, node.display, templateData, disabled);
      // ZWS before and after for cursor positioning
      fragment.appendChild(document.createTextNode(ZWS));
      fragment.appendChild(pill);
      fragment.appendChild(document.createTextNode(ZWS));
    }
  }

  return fragment;
}

/**
 * Create a pill <span> element.
 */
export function createPillSpan(blockId, display, templateData, disabled = false) {
  const span = document.createElement('span');
  span.className = `pill ${getPillCategory(blockId)} ${disabled ? 'pill--disabled' : ''}`;
  span.contentEditable = 'false';
  span.dataset.blockId = blockId;
  span.dataset.display = display;
  span.draggable = true;

  // Render the display value
  const value = templateData ? renderReport(display, templateData) : display;
  span.textContent = value || blockId;

  return span;
}

/**
 * Get available pills not yet placed in editorContent.
 */
export function getAvailablePills(blocks, content) {
  const placedIds = new Set();
  for (const node of content) {
    if (node.type === 'pill') placedIds.add(node.blockId);
  }

  const available = [];
  for (const block of blocks) {
    // Extract all variable names from template + pointsTemplate
    const vars = extractVariables(block.template);
    if (block.pointsTemplate) vars.push(...extractVariables(block.pointsTemplate));

    for (const v of vars) {
      if (!placedIds.has(v)) {
        available.push({
          blockId: v,
          label: block.label || v,
          display: `{{${v}}}`,
          category: v.includes('Points') || v.includes('Score') || v.includes('total') ? 'score' : 'finding',
        });
      }
    }
  }

  return available;
}

/**
 * Merge adjacent text nodes, remove empty ones.
 */
export function normalizeContent(content) {
  const result = [];
  for (const node of content) {
    if (node.type === 'text') {
      if (result.length > 0 && result[result.length - 1].type === 'text') {
        result[result.length - 1].value += node.value;
      } else if (node.value) {
        result.push({ ...node });
      }
    } else {
      result.push({ ...node });
    }
  }
  return result;
}

// --- Helpers ---

function parseTemplate(template) {
  const parts = [];
  const regex = /\{\{(\w+)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: template.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'variable', variable: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    parts.push({ type: 'text', value: template.slice(lastIndex) });
  }

  return parts;
}

function extractVariables(template) {
  const vars = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = regex.exec(template)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}

function getPillCategory(blockId) {
  if (blockId.includes('Points') || blockId.includes('Score') || blockId === 'totalScore') return 'pill--score';
  if (blockId.includes('Summaries') || blockId.includes('Summary') || blockId.includes('impression')) return 'pill--meta';
  return 'pill--finding';
}

/**
 * Resolve a display alias for a pill based on the current value.
 * Returns the aliased text if found, null otherwise.
 */
function resolveAlias(blockId, state, templateData, definition) {
  if (!state?.aliases || !templateData || !definition) return null;

  const currentValue = templateData[blockId];
  if (!currentValue) return null;

  // Find the section with options
  const sections = [...(definition.sections || []), ...(definition.majorFeatures || [])];
  const section = sections.find((s) => s.id === blockId);
  if (!section?.options) return null;

  // Match current value to an option
  const matched = section.options.find((o) => o.label === currentValue || o.id === currentValue);
  if (matched && state.aliases[matched.id]) {
    return state.aliases[matched.id];
  }

  return null;
}
