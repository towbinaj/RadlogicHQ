/**
 * UTD / SFU Hydronephrosis grading — definition.
 *
 * References:
 *   UTD: Nguyen HT et al. J Pediatr Urol 2014;10(6):982-998.
 *   SFU: Fernbach SK et al. J Urol 1993;49(Pt 2):10-12.
 */

export const hydronephrosisDefinition = {
  id: 'hydronephrosis',
  name: 'Hydronephrosis',

  utdPostnatal: [
    { id: 'normal', label: 'Normal', description: 'APRPD <10 mm, no calyceal dilation', management: 'No follow-up needed' },
    { id: 'P1', label: 'UTD P1 (Mild)', description: 'APRPD 10–<15 mm and/or central calyceal dilation only', management: 'Follow-up ultrasound' },
    { id: 'P2', label: 'UTD P2 (Moderate)', description: 'APRPD ≥15 mm or peripheral calyceal dilation', management: 'Follow-up ultrasound; consider further evaluation' },
    { id: 'P3', label: 'UTD P3 (Severe)', description: 'Any APRPD with ureteral dilation, abnormal parenchyma, cysts, or bladder abnormalities', management: 'Further evaluation recommended' },
  ],

  utdAntenatal: [
    { id: 'normal', label: 'Normal', description: '16–27 wk: APRPD <4 mm; ≥28 wk: APRPD <7 mm', management: 'No follow-up needed' },
    { id: 'A1', label: 'UTD A1 (Mild)', description: '16–27 wk: APRPD 4–<7 mm; ≥28 wk: APRPD 7–<10 mm; central calyceal dilation only', management: 'Postnatal ultrasound recommended' },
    { id: 'A2-3', label: 'UTD A2-3 (Moderate-Severe)', description: '16–27 wk: APRPD ≥7 mm; ≥28 wk: APRPD ≥10 mm; peripheral calyceal dilation or other abnormalities', management: 'Postnatal ultrasound and further evaluation' },
  ],

  sfuGrades: [
    { id: '0', label: 'SFU Grade 0', description: 'No hydronephrosis' },
    { id: '1', label: 'SFU Grade 1', description: 'Renal pelvis dilation only; no calyceal dilation' },
    { id: '2', label: 'SFU Grade 2', description: 'Pelvic dilation with a few dilated calyces' },
    { id: '3', label: 'SFU Grade 3', description: 'All calyces dilated; normal parenchymal thickness' },
    { id: '4', label: 'SFU Grade 4', description: 'All calyces dilated with parenchymal thinning' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  // Bilateral pastes (e.g. "Right kidney: UTD P2. Left kidney: UTD P1.")
  // split into per-side segments so each side's grade and APRPD route to
  // its own formState fields independently. The tool's UI enters
  // bilateral mode automatically when both sides are matched.
  parseSegmentation: { type: 'laterality' },

  parseRules: {
    grade: {
      options: {
        P3: ['utd p3', 'p3', 'severe hydronephrosis'],
        P2: ['utd p2', 'p2', 'moderate hydronephrosis'],
        P1: ['utd p1', 'p1', 'mild hydronephrosis'],
        'A2-3': ['utd a2-3', 'a2-3', 'utd a2', 'utd a3'],
        A1: ['utd a1', 'a1'],
        '4': ['sfu grade 4', 'sfu 4', 'grade 4 hydronephrosis'],
        '3': ['sfu grade 3', 'sfu 3', 'grade 3 hydronephrosis'],
        '2': ['sfu grade 2', 'sfu 2', 'grade 2 hydronephrosis'],
        '1': ['sfu grade 1', 'sfu 1', 'grade 1 hydronephrosis'],
        '0': ['sfu grade 0', 'sfu 0', 'no hydronephrosis'],
        normal: ['normal', 'no hydronephrosis'],
      },
    },
    side: {
      options: {
        right: ['right kidney', 'right renal', 'right'],
        left: ['left kidney', 'left renal', 'left'],
        bilateral: ['bilateral', 'both kidneys', 'both'],
      },
    },
    aprpd: {
      pattern: /aprpd[:\s]*(\d*\.?\d+)\s*(?:mm)?/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
  },
};
