/**
 * AAST Pancreas Injury Scale (2018) — definition.
 *
 * Reference: Kozar RA et al. J Trauma Acute Care Surg 2018;85(6):1119-1122.
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
