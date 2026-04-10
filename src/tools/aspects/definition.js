/**
 * ASPECTS (Alberta Stroke Program Early CT Score) — definition.
 *
 * Reference: Barber PA et al. Lancet 2000;355(9216):1670-1674.
 *
 * 10 regions in the MCA territory. Start at 10, subtract 1 per
 * region with early ischemic changes. Score 0-10.
 */

export const aspectsDefinition = {
  id: 'aspects',
  name: 'ASPECTS',

  regions: [
    { id: 'C', label: 'C — Caudate head' },
    { id: 'L', label: 'L — Lentiform nucleus' },
    { id: 'IC', label: 'IC — Internal capsule' },
    { id: 'I', label: 'I — Insular ribbon' },
    { id: 'M1', label: 'M1 — Frontal operculum' },
    { id: 'M2', label: 'M2 — Anterior temporal lobe' },
    { id: 'M3', label: 'M3 — Posterior temporal lobe' },
    { id: 'M4', label: 'M4 — Anterior MCA territory (superior to M1)' },
    { id: 'M5', label: 'M5 — Lateral MCA territory (superior to M2)' },
    { id: 'M6', label: 'M6 — Posterior MCA territory (superior to M3)' },
  ],

  parseRules: {},
};
