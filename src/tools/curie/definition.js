/**
 * MIBG Scoring — Curie Score and SIOPEN Score for neuroblastoma.
 * Two scoring modes selectable by tab.
 *
 * References:
 * - Matthay KK et al. J Clin Oncol 2003;21(6):1366-1372. (Curie)
 * - Lewington V et al. Eur J Nucl Med Mol Imaging 2017;44(2):222-233. (SIOPEN)
 */
import { parseFindings } from '../../core/parser.js';

export const curieDefinition = {
  id: 'curie',
  name: 'MIBG Score',
  version: '1.0.0',
  description:
    'MIBG semi-quantitative scoring for neuroblastoma — Curie score and SIOPEN score.',
  cdeSetId: null,

  // Curie: 10 segments, scored 0-3, max 30
  curieSegments: [
    { id: 'craniofacial', label: 'Craniofacial (skull)' },
    { id: 'cervThoSpine', label: 'Cervical and thoracic spine' },
    { id: 'chest', label: 'Chest (ribs, sternum, clavicles, scapulae)' },
    { id: 'lumSacSpine', label: 'Lumbar and sacral spine' },
    { id: 'pelvis', label: 'Pelvis' },
    { id: 'upperArms', label: 'Upper arms (humeri)' },
    { id: 'lowerArmsHands', label: 'Lower arms and hands' },
    { id: 'femurs', label: 'Femurs' },
    { id: 'lowerLegsFeet', label: 'Lower legs and feet' },
    { id: 'softTissue', label: 'Soft tissue' },
  ],

  curieScoreOptions: [
    { id: '0', label: '0', tooltip: 'No MIBG involvement' },
    { id: '1', label: '1', tooltip: 'One site of MIBG avidity' },
    { id: '2', label: '2', tooltip: 'More than one site of MIBG avidity' },
    { id: '3', label: '3', tooltip: 'Diffuse involvement (>50% of segment)' },
  ],

  // SIOPEN: 12 segments, scored 0-6, max 72
  siopenSegments: [
    { id: 'skull', label: 'Skull' },
    { id: 'thoracicCage', label: 'Thoracic cage (ribs, sternum, clavicles, scapulae)' },
    { id: 'proxRightUpper', label: 'Proximal right upper limb' },
    { id: 'distRightUpper', label: 'Distal right upper limb' },
    { id: 'proxLeftUpper', label: 'Proximal left upper limb' },
    { id: 'distLeftUpper', label: 'Distal left upper limb' },
    { id: 'spine', label: 'Spine (entire)' },
    { id: 'pelvisSiopen', label: 'Pelvis' },
    { id: 'proxRightLower', label: 'Proximal right lower limb' },
    { id: 'distRightLower', label: 'Distal right lower limb' },
    { id: 'proxLeftLower', label: 'Proximal left lower limb' },
    { id: 'distLeftLower', label: 'Distal left lower limb' },
  ],

  siopenScoreOptions: [
    { id: '0', label: '0', tooltip: 'No involvement' },
    { id: '1', label: '1', tooltip: 'One discrete lesion' },
    { id: '2', label: '2', tooltip: 'Two discrete lesions' },
    { id: '3', label: '3', tooltip: 'Three discrete lesions' },
    { id: '4', label: '4', tooltip: '>3 discrete foci or single diffuse lesion <50% of bone' },
    { id: '5', label: '5', tooltip: 'Diffuse involvement >50-95% of bone' },
    { id: '6', label: '6', tooltip: 'Diffuse involvement of entire bone' },
  ],

  parseRules: {
    // Curie segments use specific anatomic keywords
    craniofacial: {
      pattern: /(?:skull|craniofacial|calvari)\w*\s*(?:score)?\s*[:=]?\s*(\d)/i,
      group: 1,
      transform: (m) => m[1],
    },
    cervThoSpine: {
      pattern: /(?:cervi?c(?:al|o)?|thoracic)\s*(?:(?:&|and)\s*thoracic\s*)?spine\s*(?:score)?\s*[:=]?\s*(\d)/i,
      group: 1,
      transform: (m) => m[1],
    },
    pelvis: {
      pattern: /pelvi(?:s|c)\s*(?:score)?\s*[:=]?\s*(\d)/i,
      group: 1,
      transform: (m) => m[1],
    },
    softTissue: {
      pattern: /soft\s*tissue\s*(?:score)?\s*[:=]?\s*(\d)/i,
      group: 1,
      transform: (m) => m[1],
    },
    chest: segRule(String.raw`(?:chest|ribs?|thorax)`, 3),
    lumSacSpine: segRule(String.raw`(?:lumb(?:ar|o)(?:\s*(?:and|-)?\s*sacral)?\s*spine|lumbosacral\s+spine)`, 3),
    upperArms: segRule(String.raw`(?:upper\s+arms?|humer(?:us|i))`, 3),
    lowerArmsHands: segRule(String.raw`(?:lower\s+arms?(?:\s+and\s+hands)?|forearms?)`, 3),
    femurs: segRule(String.raw`(?:femurs?|femora)`, 3),
    lowerLegsFeet: segRule(String.raw`(?:lower\s+legs?(?:\s+and\s+feet)?)`, 3),
  },
};

/** "<segment> [score] [:=] N" with N limited to the scale maximum. */
function segRule(name, max) {
  return {
    pattern: new RegExp(name + String.raw`\s*(?:score)?\s*[:=]?\s*([0-${max}])\b`, 'i'),
    group: 1,
    transform: (m) => m[1],
  };
}

const LIMB = (prox, side, limb) => segRule(
  String.raw`${prox}\s+${side}\s+${limb}\s+(?:limb|extremity)`, 6);

/** SIOPEN scoring (0-6 per segment) uses its own segment keys. */
export const siopenParseDefinition = {
  id: 'curie-siopen',
  parseRules: {
    skull: segRule(String.raw`skull`, 6),
    thoracicCage: segRule(String.raw`(?:thoracic\s+cage|ribs?|chest)`, 6),
    spine: segRule(String.raw`spine`, 6),
    pelvisSiopen: segRule(String.raw`pelvi(?:s|c)`, 6),
    proxRightUpper: LIMB('proximal', 'right', 'upper'),
    distRightUpper: LIMB('distal', 'right', 'upper'),
    proxLeftUpper: LIMB('proximal', 'left', 'upper'),
    distLeftUpper: LIMB('distal', 'left', 'upper'),
    proxRightLower: LIMB('proximal', 'right', 'lower'),
    distRightLower: LIMB('distal', 'right', 'lower'),
    proxLeftLower: LIMB('proximal', 'left', 'lower'),
    distLeftLower: LIMB('distal', 'left', 'lower'),
  },
};

/** Parse with the rule set for the active scoring mode. */
export function parseMibg(text, mode) {
  return parseFindings(text, mode === 'siopen' ? siopenParseDefinition : curieDefinition);
}
