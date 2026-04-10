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

  parseRules: {},
};
