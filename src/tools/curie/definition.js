/**
 * MIBG Scoring — Curie Score and SIOPEN Score for neuroblastoma.
 * Two scoring modes selectable by tab.
 *
 * References:
 * - Matthay KK et al. J Clin Oncol 2003;21(6):1366-1372. (Curie)
 * - Lewington V et al. Eur J Nucl Med Mol Imaging 2017;44(2):222-233. (SIOPEN)
 */
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
    { id: 'cervThoSpine', label: 'Cervical & thoracic spine' },
    { id: 'chest', label: 'Chest (ribs, sternum, clavicles, scapulae)' },
    { id: 'lumSacSpine', label: 'Lumbar & sacral spine' },
    { id: 'pelvis', label: 'Pelvis' },
    { id: 'upperArms', label: 'Upper arms (humeri)' },
    { id: 'lowerArmsHands', label: 'Lower arms & hands' },
    { id: 'femurs', label: 'Femurs' },
    { id: 'lowerLegsFeet', label: 'Lower legs & feet' },
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

  parseRules: {},
};
