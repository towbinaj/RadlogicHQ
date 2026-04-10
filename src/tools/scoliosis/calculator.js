/**
 * Scoliosis calculator — formats curve descriptions and assembles template variables.
 */

export function calculateScoliosis(formState) {
  const { curves, hardware, hardwareDetail, scoliosisType, kyphosis, pelvicObliquity, pelvicObliquityDetail, vertebralAbnormalities, vertebralDetail, ribAbnormalities, ribDetail, triradiate, risser, priorMeasurements, chestAbdomen } = formState;

  // --- Curves ---
  const curveDescriptions = [];
  let primaryAngle = null;

  for (const c of curves) {
    if (!c.angle && !c.direction && !c.region) continue;
    const desc = formatCurve(c);
    if (desc) curveDescriptions.push(desc);
    if (primaryAngle == null && c.angle > 0) primaryAngle = c.angle;
  }

  const hasCurves = curveDescriptions.length > 0;
  const curvesText = hasCurves ? curveDescriptions.join('\n') : 'None.';

  // --- Hardware ---
  let hardwareText = 'None.';
  if (hardware === 'present' && hardwareDetail) {
    hardwareText = hardwareDetail;
  } else if (hardware === 'present') {
    hardwareText = 'Present.';
  }

  // --- Scoliosis type ---
  const typeMap = { na: 'N/A', idiopathic: 'Idiopathic', congenital: 'Congenital', infantile: 'Infantile', neuromuscular: 'Neuromuscular', syndrome: 'Syndrome related', unknown: 'Unknown' };
  const scoliosisTypeLabel = typeMap[scoliosisType] || '';

  // --- Kyphosis ---
  const kyphosisMap = { normal: 'Normal', na: 'N/A', increased: 'Increased', decreased: 'Decreased' };
  const kyphosisLabel = kyphosisMap[kyphosis] || '';

  // --- Pelvic obliquity ---
  let pelvicObliquityText = 'None.';
  if (pelvicObliquity === 'present' && pelvicObliquityDetail) {
    pelvicObliquityText = pelvicObliquityDetail;
  } else if (pelvicObliquity === 'present') {
    pelvicObliquityText = 'Present.';
  }

  // --- Vertebral abnormalities ---
  let vertebralText = 'None.';
  if (vertebralAbnormalities === 'present' && vertebralDetail) {
    vertebralText = vertebralDetail;
  } else if (vertebralAbnormalities === 'present') {
    vertebralText = 'Present.';
  }

  // --- Rib abnormalities ---
  let ribText = 'None.';
  if (ribAbnormalities === 'present' && ribDetail) {
    ribText = ribDetail;
  } else if (ribAbnormalities === 'present') {
    ribText = 'Present.';
  }

  // --- Triradiate ---
  const triradMap = { open: 'Open', closing: 'Closing', closed: 'Closed', 'not-visualized': 'Not visualized' };
  const triradiateLabel = triradMap[triradiate] || '';

  // --- Risser ---
  const risserLabel = risser != null ? String(risser) : '';

  // --- Prior measurements ---
  const priorText = priorMeasurements?.trim() || '';

  // --- Chest/abdomen ---
  const chestAbdomenText = chestAbdomen?.trim() || 'Normal.';

  return {
    curvesText,
    hasCurves,
    primaryAngle,
    hardwareText,
    scoliosisTypeLabel,
    scoliosisTypeProvided: !!scoliosisType,
    kyphosisLabel,
    kyphosisProvided: !!kyphosis,
    pelvicObliquityText,
    vertebralText,
    ribText,
    triradiateLabel,
    triradiateProvided: !!triradiate,
    risserLabel,
    risserProvided: risser != null,
    priorText,
    priorProvided: priorText.length > 0,
    chestAbdomenText,
  };
}

function formatCurve(c) {
  const parts = [];

  // Direction + region
  const dirLabel = c.direction === 'dextro' ? 'Dextroscoliosis' : c.direction === 'levo' ? 'Levoscoliosis' : 'Scoliosis';
  const regionMap = { cervical: 'cervical', cervicothoracic: 'cervicothoracic', thoracic: 'thoracic', thoracolumbar: 'thoracolumbar', lumbar: 'lumbar', lumbosacral: 'lumbosacral' };
  const regionLabel = regionMap[c.region] || '';

  if (regionLabel) {
    parts.push(`${dirLabel} of the ${regionLabel} spine`);
  } else {
    parts.push(dirLabel);
  }

  // Angle
  if (c.angle > 0) {
    parts[0] += ` measuring ${c.angle} degrees`;
  }

  // Vertebral range
  if (c.upperVertebra && c.lowerVertebra) {
    parts[0] += ` (${c.upperVertebra}-${c.lowerVertebra})`;
  }

  // Apex
  if (c.apex) {
    parts[0] += `, apex at ${c.apex}`;
  }

  return parts[0] + '.';
}
