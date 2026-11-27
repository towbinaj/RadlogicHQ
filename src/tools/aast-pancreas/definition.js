/**
 * AAST Pancreas Injury Scale (1990) — definition.
 *
 * Reference: Moore EE et al. Organ injury scaling, II: Pancreas, duodenum, small
 *   bowel, colon, and rectum. J Trauma 1990;30(11):1427-1429.
 *   (Kozar 2018 revised spleen, liver and kidney only. AAST published a revised
 *   pancreas scale in 2024 -- Notrica et al., J Trauma Acute Care Surg 2025.)
 */

export const aastPancreasDefinition = {
  id: 'aast-pancreas',
  name: 'AAST Pancreas',
  organ: 'Pancreas',

  categories: [
    {
      id: 'parenchymal',
      label: 'Parenchymal Injury',
      findings: [
        { id: 'contusion-minor', label: 'Minor contusion without duct injury', grade: 1 },
        { id: 'lac-superficial', label: 'Superficial laceration without duct injury', grade: 1 },
        { id: 'contusion-major', label: 'Major contusion without duct injury or tissue loss', grade: 2 },
        { id: 'lac-major', label: 'Major laceration without duct injury or tissue loss', grade: 2 },
      ],
    },
    {
      id: 'ductal',
      label: 'Ductal Injury',
      findings: [
        { id: 'distal-transection', label: 'Distal transection or laceration with duct injury (left of SMV)', grade: 3 },
        { id: 'proximal-transection', label: 'Proximal transection or laceration involving ampulla (right of SMV)', grade: 4 },
      ],
    },
    {
      id: 'massive',
      label: 'Massive Disruption',
      findings: [
        { id: 'massive-head', label: 'Massive disruption of pancreatic head', grade: 5 },
      ],
    },
  ],

  parseRules: {},
};
