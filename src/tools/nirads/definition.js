/**
 * NI-RADS (Neck Imaging Reporting and Data System) — definition.
 *
 * Reference: Aiken AH et al. AJNR Am J Neuroradiol 2020;41(11):2136-2142.
 */

export const niradsDefinition = {
  id: 'nirads',
  name: 'NI-RADS',

  primaryCategories: [
    { id: '1', label: '1 — No evidence of recurrence', findings: 'Expected post-treatment changes only', management: 'Routine surveillance', recurrence: '~4%' },
    { id: '2a', label: '2a — Low suspicion (superficial)', findings: 'Superficial mucosal enhancement or ill-defined soft tissue', management: 'Direct visualization', recurrence: '~29%' },
    { id: '2b', label: '2b — Low suspicion (deep)', findings: 'Deep or submucosal enhancement, mild-moderate FDG uptake', management: 'Short-interval follow-up (3 months) or PET', recurrence: '~29%' },
    { id: '3', label: '3 — High suspicion', findings: 'New or enlarging mass, marked enhancement or intense FDG uptake', management: 'Biopsy recommended', recurrence: '~74%' },
    { id: '4', label: '4 — Definite recurrence', findings: 'Pathologically proven or unmistakable progression', management: 'Treatment', recurrence: '~100%' },
  ],

  neckCategories: [
    { id: '1', label: '1 — No suspicious nodes', management: 'Routine surveillance' },
    { id: '2', label: '2 — Low suspicion', management: 'Short-interval follow-up or PET' },
    { id: '3', label: '3 — High suspicion', management: 'Biopsy recommended' },
    { id: '4', label: '4 — Definite recurrence', management: 'Treatment' },
  ],

  parseRules: {},
};
