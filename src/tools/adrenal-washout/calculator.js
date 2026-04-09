/**
 * Adrenal Washout Calculator.
 *
 * Absolute washout = (enhanced - delayed) / (enhanced - unenhanced) × 100
 *   Threshold: ≥60% → adenoma
 *
 * Relative washout = (enhanced - delayed) / enhanced × 100
 *   Threshold: ≥40% → adenoma
 *   (used when unenhanced is not available)
 *
 * Unenhanced ≤10 HU alone → lipid-rich adenoma (no washout needed)
 *
 * Reference: Caoili EM et al. Radiology 2002;222(3):629-633.
 */

/**
 * @param {Object} formState
 * @returns {Object}
 */
export function calculateAdrenalWashout(formState) {
  const { unenhanced, enhanced, delayed, side } = formState;

  const hasUnenh = unenhanced != null;
  const hasEnh = enhanced != null;
  const hasDel = delayed != null;

  // Unenhanced ≤10 HU → lipid-rich adenoma
  let lipidRich = false;
  if (hasUnenh && unenhanced <= 10) {
    lipidRich = true;
  }

  // Absolute washout (requires all 3 phases)
  let absoluteWashout = null;
  let absoluteLabel = '';
  if (hasUnenh && hasEnh && hasDel && enhanced !== unenhanced) {
    absoluteWashout = Math.round(((enhanced - delayed) / (enhanced - unenhanced)) * 1000) / 10;
    absoluteLabel = `${absoluteWashout}%`;
  }

  // Relative washout (requires enhanced + delayed only)
  let relativeWashout = null;
  let relativeLabel = '';
  if (hasEnh && hasDel && enhanced !== 0) {
    relativeWashout = Math.round(((enhanced - delayed) / enhanced) * 1000) / 10;
    relativeLabel = `${relativeWashout}%`;
  }

  // Interpretation
  let interpretation = '';
  let interpretationLevel = 0;

  if (lipidRich) {
    interpretation = 'Lipid-rich adenoma (unenhanced ≤10 HU)';
    interpretationLevel = 1;
  } else if (absoluteWashout != null) {
    if (absoluteWashout >= 60) {
      interpretation = 'Consistent with adenoma (absolute washout ≥60%)';
      interpretationLevel = 1;
    } else {
      interpretation = 'Indeterminate — does not meet adenoma washout threshold (absolute washout <60%)';
      interpretationLevel = 3;
    }
  } else if (relativeWashout != null) {
    if (relativeWashout >= 40) {
      interpretation = 'Consistent with adenoma (relative washout ≥40%)';
      interpretationLevel = 1;
    } else {
      interpretation = 'Indeterminate — does not meet adenoma washout threshold (relative washout <40%)';
      interpretationLevel = 3;
    }
  }

  return {
    side: side || '',
    sideProvided: !!side,
    sideLabel: side === 'right' ? 'Right' : side === 'left' ? 'Left' : '',
    unenhanced: hasUnenh ? unenhanced : null,
    enhanced: hasEnh ? enhanced : null,
    delayed: hasDel ? delayed : null,
    unenhancedProvided: hasUnenh,
    enhancedProvided: hasEnh,
    delayedProvided: hasDel,
    lipidRich,
    absoluteWashout,
    absoluteWashoutLabel: absoluteLabel,
    absoluteProvided: absoluteWashout != null,
    relativeWashout,
    relativeWashoutLabel: relativeLabel,
    relativeProvided: relativeWashout != null,
    interpretation,
    interpretationLevel,
    hasResult: lipidRich || absoluteWashout != null || relativeWashout != null,
  };
}
