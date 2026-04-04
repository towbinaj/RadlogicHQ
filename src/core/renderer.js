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
export function renderToolForm(container, definition, onChange) {
  container.innerHTML = '';

  const imageBase = `/images/${definition.id}/`;

  // Scored sections
  for (const section of definition.sections) {
    const sectionEl = createScoredSection(section, onChange, imageBase);
    container.appendChild(sectionEl);
  }

  // Additional inputs (size, location, text, etc.)
  if (definition.additionalInputs) {
    for (const input of definition.additionalInputs) {
      const inputEl = createAdditionalInput(input, onChange);
      container.appendChild(inputEl);
    }
  }
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

    const el = document.createElement('input');
    el.type = 'number';
    el.id = `input-${input.id}`;
    el.min = input.min ?? '';
    el.max = input.max ?? '';
    el.step = input.step ?? (input.inputType === 'float' ? '0.1' : '1');
    el.placeholder = input.placeholder || '';
    el.addEventListener('input', () => {
      const val = el.value !== '' ? parseFloat(el.value) : null;
      onChange(input.id, val);
    });
    row.appendChild(el);

    if (input.unit) {
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
