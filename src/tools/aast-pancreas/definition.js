/**
 * AAST Pancreatic Organ Injury Scale (2024 revision) — definition.
 *
 * Reference: Notrica DM, Tominaga GT, Gross JA, et al. American Association
 *   for the Surgery of Trauma pancreatic organ injury scale: 2024 revision.
 *   J Trauma Acute Care Surg 2025;98(3):442-447. doi:10.1097/TA.0000000000004522
 *   (Table 1). Supersedes Moore EE et al., J Trauma 1990;30(11):1427-1429.
 *
 * Key rules from the paper:
 * - Grade by highest injury; subgrade letters follow the grade (III-N, IV-A...).
 * - Subgrades A-D for III/IV/V require definitive ductal evaluation (ERCP,
 *   MRCP with visible duct, surgery +/- intraoperative US, or pathology).
 *   Without it, a >=50% depth injury is -N.
 * - A suspected high-grade injury on CT with full ERCP visualization of an
 *   intact main duct is Grade II.
 * - Neck/body/tail = overlying or left of the portal vein/SMV. Head/uncinate =
 *   any portion of the injury right of or posterior to the SMV.
 * - Depth is measured anteroposterior or craniocaudal.
 * - The paper describes no advancement for multiple low-grade injuries.
 *
 * Labels are ASCII only (">=" not the unicode sign) and avoid HL7 delimiters.
 */

const DUCT_EVAL = 'Definitive ductal evaluation: ERCP, MRCP with the duct visible, surgery with or without intraoperative US, or pathology.';
const NBT = 'Neck, body, or tail: overlying or left of the portal vein or SMV.';
const HEAD = 'Head or uncinate process: any portion of the injury right of or posterior to the SMV.';
const DEPTH = 'Depth is measured anteroposterior or craniocaudal.';

export const aastPancreasDefinition = {
  id: 'aast-pancreas',
  name: 'AAST Pancreas',
  organ: 'Pancreas',
  scaleVersion: '2024',
  subgradeOrder: ['N', 'A', 'B', 'C', 'D'],
  advanceMultipleInjuries: false,

  categories: [
    {
      id: 'edema-contusion',
      label: 'Edema or contusion (no laceration or hematoma)',
      findings: [
        { id: 'edema', label: 'Pancreatic edema (consistent with traumatic mechanism)', grade: 1, subgrade: 'A',
          title: 'Fluid between pancreatic lobules or adjacent to the pancreas.' },
        { id: 'contusion', label: 'Pancreatic contusion without hematoma or laceration', grade: 1, subgrade: 'B',
          title: 'Hypoenhancement with possible enlargement.' },
      ],
    },
    {
      id: 'superficial',
      label: 'Laceration or hematoma <50% depth, or >=50% with intact main duct',
      findings: [
        { id: 'lac-nbt', label: 'Neck, body, or tail', grade: 2, subgrade: 'A',
          title: `${NBT} ${DEPTH} Includes a deep injury on CT when definitive ductal evaluation shows an intact main duct.` },
        { id: 'lac-head', label: 'Head or uncinate process', grade: 2, subgrade: 'B',
          title: `${HEAD} ${DEPTH} Includes a deep injury on CT when definitive ductal evaluation shows an intact main duct.` },
      ],
    },
    {
      id: 'deep-nbt',
      label: 'Deep or ductal injury, neck, body, or tail',
      findings: [
        { id: 'deep-nbt-n', label: '>=50% depth, no definitive ductal evaluation', grade: 3, subgrade: 'N',
          title: `${NBT} ${DUCT_EVAL}` },
        { id: 'duct-nbt-partial', label: 'Confirmed main duct injury with ductal alignment', grade: 3, subgrade: 'A',
          title: `${NBT} Partial injury: proximal and distal duct remain aligned or part of the duct wall is intact.` },
        { id: 'duct-nbt-complete', label: 'Confirmed main duct injury, completely transected and/or distracted', grade: 3, subgrade: 'B',
          title: `${NBT} Any failure to demonstrate alignment or continuity of the main duct.` },
      ],
    },
    {
      id: 'deep-head',
      label: 'Deep or ductal injury, head or uncinate process',
      findings: [
        { id: 'deep-head-n', label: '>=50% depth, no definitive ductal evaluation', grade: 4, subgrade: 'N',
          title: `${HEAD} ${DUCT_EVAL}` },
        { id: 'duct-head-partial', label: 'Confirmed main duct injury with ductal alignment', grade: 4, subgrade: 'A',
          title: `${HEAD} Partial injury: proximal and distal duct remain aligned or part of the duct wall is intact.` },
        { id: 'duct-head-complete', label: 'Confirmed main duct injury, completely transected and/or distracted', grade: 4, subgrade: 'B',
          title: `${HEAD} Any failure to demonstrate alignment or continuity of the main duct.` },
      ],
    },
    {
      id: 'destructive',
      label: 'Destructive injury with nonviable pancreatic head (blast or crush)',
      findings: [
        { id: 'destr-intact', label: 'With intact main pancreatic duct in head', grade: 5, subgrade: 'A',
          title: 'Blast injury includes the cavitary effect of gunshot wounds.' },
        { id: 'destr-mpd', label: 'With main pancreatic duct injury', grade: 5, subgrade: 'B' },
        { id: 'destr-cbd', label: 'With intrapancreatic common bile duct injury', grade: 5, subgrade: 'C' },
        { id: 'destr-avulsion', label: 'With avulsion of ducts off duodenum or sphincter disruption', grade: 5, subgrade: 'D' },
      ],
    },
  ],

  parseRules: {},
};
