/**
 * Fetal lateral ventricle width calculator. Auto-categorizes based on
 * atrial width measurement. Two modes:
 *
 *   1. Single-side (side = 'right' | 'left' | null):
 *      Uses formState.width. Unchanged shape.
 *
 *   2. Bilateral (side = 'bilateral'):
 *      Uses rightWidth / leftWidth. Returns combined widthLabel
 *      ("Right 11 mm, Left 10 mm") plus per-side category detail.
 *      The overall category reflects the MORE SEVERE side so the
 *      impression matches dictation conventions ("bilateral mild
 *      ventriculomegaly" when either side is in the mild range).
 */

function categorize(w) {
  if (w == null || w < 0) return { category: '', categoryLabel: '', level: 0 };
  if (w < 10) return { category: 'Normal', categoryLabel: 'Normal (<10 mm)', level: 1 };
  if (w <= 12) return { category: 'Mild ventriculomegaly', categoryLabel: 'Mild (10-12 mm)', level: 2 };
  if (w < 15) return { category: 'Moderate ventriculomegaly', categoryLabel: 'Moderate (12.1-14.9 mm)', level: 3 };
  return { category: 'Severe ventriculomegaly', categoryLabel: 'Severe (>=15 mm)', level: 5 };
}

const SEVERITY = (cat) => cat.category.replace(' ventriculomegaly', '').toLowerCase();

function bilateralImpression(rW, lW, rCat, lCat) {
  const rAbn = rCat.level > 1;
  const lAbn = lCat.level > 1;
  if (rCat.level && lCat.level) {
    if (rAbn && lAbn) return `Bilateral ventriculomegaly: right ${SEVERITY(rCat)} (${rW} mm), left ${SEVERITY(lCat)} (${lW} mm).`;
    if (rAbn) return `Right ${rCat.category.toLowerCase()} (${rW} mm). Left lateral ventricle normal (${lW} mm).`;
    if (lAbn) return `Left ${lCat.category.toLowerCase()} (${lW} mm). Right lateral ventricle normal (${rW} mm).`;
    return `Normal lateral ventricles (right ${rW} mm, left ${lW} mm).`;
  }
  if (rCat.level) return rAbn ? `Right ${rCat.category.toLowerCase()} (${rW} mm).` : `Right lateral ventricle normal (${rW} mm).`;
  if (lCat.level) return lAbn ? `Left ${lCat.category.toLowerCase()} (${lW} mm).` : `Left lateral ventricle normal (${lW} mm).`;
  return '';
}

function singleImpression(side, w, cat) {
  if (!cat.level) return '';
  const S = side === 'right' ? 'Right' : side === 'left' ? 'Left' : '';
  if (cat.level === 1) return S ? `${S} lateral ventricle normal (${w} mm).` : `Normal lateral ventricle atrial width (${w} mm).`;
  return S ? `${S} ${cat.category.toLowerCase()} (${w} mm).` : `${cat.category} (${w} mm).`;
}

export function calculateFetalVentricle(formState) {
  const { width, side, ga, rightWidth, leftWidth } = formState;
  const sideLabels = { right: 'Right', left: 'Left', bilateral: 'Bilateral' };

  if (side === 'bilateral') {
    const rHas = rightWidth != null && rightWidth >= 0;
    const lHas = leftWidth != null && leftWidth >= 0;

    const rCat = categorize(rightWidth);
    const lCat = categorize(leftWidth);

    const widthParts = [];
    if (rHas) widthParts.push(`Right ${rightWidth} mm`);
    if (lHas) widthParts.push(`Left ${leftWidth} mm`);

    // Overall category = more severe side. If one side is missing,
    // use the other; if both missing, empty.
    const combinedLevel = Math.max(rCat.level, lCat.level);
    const combined = combinedLevel === rCat.level ? rCat : lCat;

    return {
      width: null,
      widthLabel: widthParts.length ? widthParts.join(', ') : '--',
      widthProvided: widthParts.length > 0,
      category: combined.category,
      categoryLabel: combined.categoryLabel,
      categoryProvided: !!combined.category,
      sideLabel: 'Bilateral',
      sideProvided: true,
      gaLabel: ga ? `${ga} weeks` : '',
      gaProvided: !!ga,
      rightWidth: rHas ? rightWidth : null,
      rightWidthLabel: rHas ? `${rightWidth} mm` : '',
      rightWidthProvided: rHas,
      rightCategory: rCat.category,
      leftWidth: lHas ? leftWidth : null,
      leftWidthLabel: lHas ? `${leftWidth} mm` : '',
      leftWidthProvided: lHas,
      leftCategory: lCat.category,
      bilateral: true,
      impressionText: bilateralImpression(rightWidth, leftWidth, rCat, lCat),
      level: combinedLevel,
    };
  }

  // Single side
  const hasWidth = width != null && width >= 0;
  const cat = categorize(width);

  return {
    width: hasWidth ? width : null,
    widthLabel: hasWidth ? `${width} mm` : '--',
    widthProvided: hasWidth,
    category: cat.category,
    categoryLabel: cat.categoryLabel,
    categoryProvided: !!cat.category,
    sideLabel: sideLabels[side] || '',
    sideProvided: !!side,
    gaLabel: ga ? `${ga} weeks` : '',
    gaProvided: !!ga,
    bilateral: false,
    impressionText: singleImpression(side, width, cat),
    level: cat.level,
  };
}
