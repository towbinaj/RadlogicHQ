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
    { id: 'C', label: 'C — Caudate head', image: '/images/aspects/caudate.svg' },
    { id: 'L', label: 'L — Lentiform nucleus', image: '/images/aspects/lentiform.svg' },
    { id: 'IC', label: 'IC — Internal capsule', image: '/images/aspects/internal-capsule.svg' },
    { id: 'I', label: 'I — Insular ribbon', image: '/images/aspects/insular.svg' },
    { id: 'M1', label: 'M1 — Frontal operculum', image: '/images/aspects/m1.svg' },
    { id: 'M2', label: 'M2 — Anterior temporal lobe', image: '/images/aspects/m2.svg' },
    { id: 'M3', label: 'M3 — Posterior temporal lobe', image: '/images/aspects/m3.svg' },
    { id: 'M4', label: 'M4 — Anterior MCA territory (superior to M1)', image: '/images/aspects/m4.svg' },
    { id: 'M5', label: 'M5 — Lateral MCA territory (superior to M2)', image: '/images/aspects/m5.svg' },
    { id: 'M6', label: 'M6 — Posterior MCA territory (superior to M3)', image: '/images/aspects/m6.svg' },
  ],

  parseRules: {
    affected: {
      multi: true,
      options: {
        C: ['caudate', 'caudate head', 'caudate nucleus'],
        L: ['lentiform', 'lentiform nucleus', 'putamen', 'globus pallidus'],
        IC: ['internal capsule', 'posterior limb'],
        I: ['insular ribbon', 'insular cortex', 'insula'],
        M1: ['frontal operculum', 'M1 region'],
        M2: ['anterior temporal', 'M2 region'],
        M3: ['posterior temporal', 'M3 region'],
        M4: ['anterior MCA', 'superior frontal', 'M4 region'],
        M5: ['lateral MCA', 'M5 region'],
        M6: ['posterior MCA', 'M6 region'],
      },
    },
    side: {
      options: {
        right: ['right', 'right-sided', 'right MCA'],
        left: ['left', 'left-sided', 'left MCA'],
      },
    },
  },
};
