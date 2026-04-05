/**
 * Form renderer — builds DOM from a tool definition.
 * Generates scored sections with image-option cards and additional inputs.
 */

/**
 * Render a complete tool form into a container.
 * @param {HTMLElement} container - DOM element to render into
 * @param {Object} definition - Tool definition
 * @param {Function} onChange - Called with (inputId, value) on every change
 */
/**
 * @param {HTMLElement} container
 * @param {Object} definition
 * @param {Function} onChange - (inputId, value) on every input change
 * @param {Object} [options]
 * @param {Function} [options.onReorder] - (newSectionOrder: string[]) called when sections are dragged
 */
export function renderToolForm(container, definition, onChange, options = {}) {
  container.innerHTML = '';

  const imageBase = `/images/${definition.id}/`;

  // Primary inputs first
  if (definition.primaryInputs) {
    const primaryRow = document.createElement('div');
    primaryRow.className = 'primary-inputs card';
    for (const input of definition.primaryInputs) {
      const inputEl = createAdditionalInput(input, onChange);
      inputEl.classList.remove('card');
      inputEl.classList.add('primary-input-item');
      primaryRow.appendChild(inputEl);
    }
    container.appendChild(primaryRow);
  }

  // Image toggle
  if (definition.sections.some((s) => s.options?.some((o) => o.image))) {
    const toggle = document.createElement('button');
    toggle.className = 'view-toggle-link';
    toggle.id = 'toggle-compact';
    const isCompact = document.body.classList.contains('compact');
    toggle.textContent = isCompact ? 'Show images' : 'Hide images';
    toggle.addEventListener('click', () => {
      const compact = !document.body.classList.contains('compact');
      document.body.classList.toggle('compact', compact);
      toggle.textContent = compact ? 'Show images' : 'Hide images';
      localStorage.setItem('radtools:compact', compact ? '1' : '0');
    });
    container.appendChild(toggle);
  }

  // Scored sections — with drag-to-reorder
  const sectionsContainer = document.createElement('div');
  sectionsContainer.className = 'sections-container';
  container.appendChild(sectionsContainer);

  for (const section of definition.sections) {
    const sectionEl = createScoredSection(section, onChange, imageBase);
    sectionEl.draggable = true;

    // Drag handle indicator
    const header = sectionEl.querySelector('.score-section__header');
    const handle = document.createElement('span');
    handle.className = 'score-section__drag-handle';
    handle.textContent = '\u2261';
    handle.title = 'Drag to reorder';
    header.insertBefore(handle, header.firstChild);

    sectionEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', section.id);
      sectionEl.classList.add('score-section--dragging');
    });
    sectionEl.addEventListener('dragend', () => {
      sectionEl.classList.remove('score-section--dragging');
      sectionsContainer.querySelectorAll('.score-section--dragover').forEach(
        (el) => el.classList.remove('score-section--dragover')
      );
    });
    sectionEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      sectionEl.classList.add('score-section--dragover');
    });
    sectionEl.addEventListener('dragleave', () => {
      sectionEl.classList.remove('score-section--dragover');
    });
    sectionEl.addEventListener('drop', (e) => {
      e.preventDefault();
      sectionEl.classList.remove('score-section--dragover');
      const fromId = e.dataTransfer.getData('text/plain');
      const toId = section.id;
      if (fromId === toId) return;

      // Reorder definition.sections array
      const fromIdx = definition.sections.findIndex((s) => s.id === fromId);
      const toIdx = definition.sections.findIndex((s) => s.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = definition.sections.splice(fromIdx, 1);
      definition.sections.splice(toIdx, 0, moved);

      // Re-render sections in new order
      sectionsContainer.innerHTML = '';
      for (const s of definition.sections) {
        const el = createScoredSection(s, onChange, imageBase);
        addSectionDragHandlers(el, s, sectionsContainer, definition, onChange, imageBase, options);
        sectionsContainer.appendChild(el);
      }

      // Notify parent of new order
      if (options.onReorder) {
        options.onReorder(definition.sections.map((s) => s.id));
      }
    });

    sectionsContainer.appendChild(sectionEl);
  }

  // Additional inputs
  if (definition.additionalInputs) {
    for (const input of definition.additionalInputs) {
      const inputEl = createAdditionalInput(input, onChange);
      container.appendChild(inputEl);
    }
  }
}

function addSectionDragHandlers(sectionEl, section, sectionsContainer, definition, onChange, imageBase, options) {
  sectionEl.draggable = true;

  const header = sectionEl.querySelector('.score-section__header');
  const handle = document.createElement('span');
  handle.className = 'score-section__drag-handle';
  handle.textContent = '\u2261';
  handle.title = 'Drag to reorder';
  header.insertBefore(handle, header.firstChild);

  sectionEl.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', section.id);
    sectionEl.classList.add('score-section--dragging');
  });
  sectionEl.addEventListener('dragend', () => {
    sectionEl.classList.remove('score-section--dragging');
    sectionsContainer.querySelectorAll('.score-section--dragover').forEach(
      (el) => el.classList.remove('score-section--dragover')
    );
  });
  sectionEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    sectionEl.classList.add('score-section--dragover');
  });
  sectionEl.addEventListener('dragleave', () => {
    sectionEl.classList.remove('score-section--dragover');
  });
  sectionEl.addEventListener('drop', (e) => {
    e.preventDefault();
    sectionEl.classList.remove('score-section--dragover');
    const fromId = e.dataTransfer.getData('text/plain');
    const toId = section.id;
    if (fromId === toId) return;

    const fromIdx = definition.sections.findIndex((s) => s.id === fromId);
    const toIdx = definition.sections.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = definition.sections.splice(fromIdx, 1);
    definition.sections.splice(toIdx, 0, moved);

    sectionsContainer.innerHTML = '';
    for (const s of definition.sections) {
      const el = createScoredSection(s, onChange, imageBase);
      addSectionDragHandlers(el, s, sectionsContainer, definition, onChange, imageBase, options);
      sectionsContainer.appendChild(el);
    }

    if (options.onReorder) {
      options.onReorder(definition.sections.map((s) => s.id));
    }
  });
}

function createScoredSection(section, onChange, imageBase) {
  const wrapper = document.createElement('div');
  wrapper.className = 'score-section card';
  wrapper.dataset.sectionId = section.id;

  // Header with label and point display
  const header = document.createElement('div');
  header.className = 'score-section__header';
  header.innerHTML = `
    <h3 class="score-section__title">${section.label}</h3>
    <span class="score-section__points" data-points-display="${section.id}">0 pts</span>
  `;
  wrapper.appendChild(header);

  if (section.description) {
    const desc = document.createElement('p');
    desc.className = 'score-section__desc';
    desc.textContent = section.description;
    wrapper.appendChild(desc);
  }

  // Options grid
  const grid = document.createElement('div');
  grid.className = 'score-section__options';

  const isMulti = section.inputType === 'multi-select';
  const selected = new Set();

  for (const option of section.options) {
    const card = createOptionCard(option, section.id, imageBase);
    card.addEventListener('click', () => {
      if (isMulti) {
        // Multi-select: toggle individual options
        // Special: "none" deselects others, others deselect "none"
        if (option.exclusive) {
          selected.clear();
          selected.add(option.id);
        } else {
          // Remove any exclusive option
          for (const o of section.options) {
            if (o.exclusive) selected.delete(o.id);
          }
          if (selected.has(option.id)) {
            selected.delete(option.id);
          } else {
            selected.add(option.id);
          }
        }
        // Update visual state for all cards
        grid.querySelectorAll('.option-card').forEach((c) => {
          c.classList.toggle('selected', selected.has(c.dataset.optionId));
        });
        onChange(section.id, [...selected]);
      } else {
        // Single-select: deselect others
        selected.clear();
        selected.add(option.id);
        grid.querySelectorAll('.option-card').forEach((c) => {
          c.classList.toggle('selected', c.dataset.optionId === option.id);
        });
        onChange(section.id, option.id);
      }

      // Update points display
      updatePointsDisplay(section, selected);
    });
    grid.appendChild(card);
  }

  wrapper.appendChild(grid);
  return wrapper;
}

function createOptionCard(option, sectionId, imageBase) {
  const card = document.createElement('div');
  card.className = 'option-card';
  card.dataset.optionId = option.id;
  card.dataset.sectionId = sectionId;

  let html = '';

  if (option.image) {
    html += `<div class="option-card__image">
      <img src="${imageBase}${option.image}" alt="${option.label}" loading="lazy" onerror="this.parentElement.classList.add('no-image')">
    </div>`;
  } else {
    html += `<div class="option-card__image option-card__image--empty"></div>`;
  }

  html += `<div class="option-card__body">
    <span class="option-card__label">${option.label}</span>
    <span class="option-card__points">${option.points} pt${option.points !== 1 ? 's' : ''}</span>
  </div>`;

  card.innerHTML = html;
  return card;
}

function updatePointsDisplay(section, selected) {
  const display = document.querySelector(
    `[data-points-display="${section.id}"]`
  );
  if (!display) return;

  let points = 0;
  for (const id of selected) {
    const opt = section.options.find((o) => o.id === id);
    if (opt) points += opt.points ?? 0;
  }
  display.textContent = `${points} pt${points !== 1 ? 's' : ''}`;
  display.classList.toggle('has-points', points > 0);
}

function createAdditionalInput(input, onChange) {
  const group = document.createElement('div');
  group.className = 'input-group card';

  const label = document.createElement('label');
  label.textContent = input.label;
  label.setAttribute('for', `input-${input.id}`);
  group.appendChild(label);

  if (input.inputType === 'float' || input.inputType === 'integer') {
    const row = document.createElement('div');
    row.className = 'input-with-unit';

    // Unit toggle support
    const defaultUnit = input.unit || '';
    const altUnit = defaultUnit === 'cm' ? 'mm' : defaultUnit === 'mm' ? 'cm' : '';
    const storageKey = `radtools:sizeUnit:${input.id}`;
    let currentUnit = input.unitToggle ? (localStorage.getItem(storageKey) || defaultUnit) : defaultUnit;

    const el = document.createElement('input');
    el.type = 'number';
    el.className = 'no-spinner';
    el.id = `input-${input.id}`;

    function updateInputAttrs() {
      if (currentUnit === 'mm') {
        el.min = '1'; el.max = '999'; el.step = '1'; el.placeholder = 'e.g., 25';
      } else {
        el.min = input.min ?? ''; el.max = input.max ?? ''; el.step = input.step ?? '0.1';
        el.placeholder = input.placeholder || '';
      }
    }
    updateInputAttrs();

    el.addEventListener('input', () => {
      const raw = el.value !== '' ? parseFloat(el.value) : null;
      // Convert to the tool's native unit if toggled
      if (raw != null && input.unitToggle && currentUnit !== defaultUnit) {
        onChange(input.id, defaultUnit === 'cm' ? raw / 10 : raw * 10);
      } else {
        onChange(input.id, raw);
      }
    });
    row.appendChild(el);

    if (input.unitToggle && altUnit) {
      const toggle = document.createElement('div');
      toggle.className = 'unit-toggle';
      toggle.innerHTML = `
        <button class="unit-toggle__btn ${currentUnit === defaultUnit ? 'active' : ''}" data-unit="${defaultUnit}">${defaultUnit}</button>
        <button class="unit-toggle__btn ${currentUnit === altUnit ? 'active' : ''}" data-unit="${altUnit}">${altUnit}</button>
      `;
      toggle.querySelectorAll('.unit-toggle__btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.dataset.unit === currentUnit) return;
          // Convert current value
          const raw = el.value !== '' ? parseFloat(el.value) : null;
          currentUnit = btn.dataset.unit;
          localStorage.setItem(storageKey, currentUnit);
          updateInputAttrs();
          // Convert displayed value
          if (raw != null) {
            el.value = currentUnit === 'mm' && defaultUnit === 'cm' ? Math.round(raw * 10)
              : currentUnit === 'cm' && defaultUnit === 'mm' ? (raw / 10).toFixed(1)
              : currentUnit === 'cm' && defaultUnit === 'cm' ? raw
              : currentUnit === 'mm' && defaultUnit === 'mm' ? raw : raw;
          }
          toggle.querySelectorAll('.unit-toggle__btn').forEach((b) =>
            b.classList.toggle('active', b.dataset.unit === currentUnit));
        });
      });
      row.appendChild(toggle);
    } else if (input.unit) {
      const unit = document.createElement('span');
      unit.className = 'unit-label';
      unit.textContent = input.unit;
      row.appendChild(unit);
    }

    group.appendChild(row);
  } else if (input.inputType === 'text') {
    const el = document.createElement('textarea');
    el.id = `input-${input.id}`;
    el.placeholder = input.placeholder || '';
    el.rows = input.rows || 3;
    el.addEventListener('input', () => onChange(input.id, el.value));
    group.appendChild(el);
  } else if (input.inputType === 'single-select' && input.options) {
    const el = document.createElement('select');
    el.id = `input-${input.id}`;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = `Select ${input.label.toLowerCase()}...`;
    el.appendChild(defaultOpt);

    for (const opt of input.options) {
      const optEl = document.createElement('option');
      optEl.value = opt.id;
      optEl.textContent = opt.label;
      el.appendChild(optEl);
    }

    el.addEventListener('change', () => {
      onChange(input.id, el.value || null);
    });
    group.appendChild(el);
  }

  return group;
}
