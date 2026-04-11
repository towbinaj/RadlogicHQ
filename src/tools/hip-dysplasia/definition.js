/**
 * Developmental Hip Dysplasia — Graf and AAOS methods.
 *
 * References:
 *   Graf R. Clin Orthop Relat Res 1984;(184):107-112.
 *   AAOS/AAP/POSNA Clinical Practice Guideline. J Am Acad Orthop Surg 2014.
 *
 * Graf: Ultrasound-based alpha/beta angles → Types I-IV.
 * AAOS: Clinical + imaging assessment → normal/dysplastic/subluxed/dislocated.
 */

export const hipDysplasiaDefinition = {
  id: 'hip-dysplasia',
  name: 'Hip Dysplasia',

  grafTypes: [
    { id: 'Ia', label: 'Type Ia — Mature', image: '/images/hip-dysplasia/graf-ia.svg', description: 'Alpha ≥60\u00b0, beta <55\u00b0. Normal hip.' },
    { id: 'Ib', label: 'Type Ib — Mature', image: '/images/hip-dysplasia/graf-ib.svg', description: 'Alpha ≥60\u00b0, beta 55\u00b0-77\u00b0. Normal hip, broad cartilaginous roof.' },
    { id: 'IIa-plus', label: 'Type IIa+ — Immature (age-appropriate)', image: '/images/hip-dysplasia/graf-iia-plus.svg', description: 'Alpha 50\u00b0-59\u00b0, age <3 months. Physiologic immaturity, follow-up.' },
    { id: 'IIa-minus', image: '/images/hip-dysplasia/graf-iia-minus.svg', label: 'Type IIa\u2212 — Immature (delayed)', description: 'Alpha 50\u00b0-59\u00b0, age >3 months. Deficient bony acetabulum.' },
    { id: 'IIb', label: 'Type IIb — Deficient', image: '/images/hip-dysplasia/graf-iib.svg', description: 'Alpha 50\u00b0-59\u00b0, age >3 months. Ossification deficit, needs treatment.' },
    { id: 'IIc', label: 'Type IIc — Critical', image: '/images/hip-dysplasia/graf-iic.svg', description: 'Alpha 43\u00b0-49\u00b0, beta <77\u00b0. Critical range, close to subluxation.' },
    { id: 'D', label: 'Type D — Decentering', image: '/images/hip-dysplasia/graf-d.svg', description: 'Alpha 43\u00b0-49\u00b0, beta >77\u00b0. Femoral head decentering.' },
    { id: 'IIIa', label: 'Type IIIa — Eccentric', image: '/images/hip-dysplasia/graf-iiia.svg', description: 'Alpha <43\u00b0. Femoral head displaced, hyaline cartilage preserved.' },
    { id: 'IIIb', label: 'Type IIIb — Eccentric', image: '/images/hip-dysplasia/graf-iiib.svg', description: 'Alpha <43\u00b0. Femoral head displaced, cartilage degenerated.' },
    { id: 'IV', label: 'Type IV — Dislocated', image: '/images/hip-dysplasia/graf-iv.svg', description: 'Alpha <43\u00b0. Complete dislocation, labrum interposed.' },
  ],

  aaosCategories: [
    { id: 'normal', label: 'Normal', description: 'No dysplasia; normal acetabular coverage', image: '/images/hip-dysplasia/aaos-normal.svg' },
    { id: 'dysplastic', label: 'Dysplastic', description: 'Shallow acetabulum; femoral head contained but undercovered', image: '/images/hip-dysplasia/aaos-dysplastic.svg' },
    { id: 'subluxed', label: 'Subluxed', description: 'Femoral head partially displaced from acetabulum', image: '/images/hip-dysplasia/aaos-subluxed.svg' },
    { id: 'dislocated', label: 'Dislocated', description: 'Femoral head completely out of acetabulum', image: '/images/hip-dysplasia/aaos-dislocated.svg' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  parseRules: {
    grade: {
      options: {
        'IV': ['type iv', 'graf iv', 'graf type iv', 'complete dislocation', 'dislocated'],
        'IIIb': ['type iiib', 'graf iiib', 'graf type iiib', 'cartilage degenerated'],
        'IIIa': ['type iiia', 'graf iiia', 'graf type iiia', 'hyaline cartilage preserved'],
        'D': ['type d', 'graf d', 'decentering', 'femoral head decentering'],
        'IIc': ['type iic', 'graf iic', 'graf type iic', 'critical range'],
        'IIb': ['type iib', 'graf iib', 'graf type iib', 'ossification deficit'],
        'IIa-minus': ['type iia-', 'type iia minus', 'graf iia-', 'delayed maturation'],
        'IIa-plus': ['type iia+', 'type iia plus', 'graf iia+', 'physiologic immaturity', 'age-appropriate'],
        'Ib': ['type ib', 'graf ib', 'graf type ib', 'broad cartilaginous roof'],
        'Ia': ['type ia', 'graf ia', 'graf type ia', 'mature hip', 'normal hip'],
        'dislocated': ['dislocated', 'complete dislocation', 'aaos dislocated'],
        'subluxed': ['subluxed', 'subluxation', 'partially displaced', 'aaos subluxed'],
        'dysplastic': ['dysplastic', 'shallow acetabulum', 'undercovered', 'aaos dysplastic'],
        'normal': ['normal', 'no dysplasia', 'aaos normal'],
      },
    },
    side: {
      options: {
        right: ['right hip', 'right'],
        left: ['left hip', 'left'],
        bilateral: ['bilateral', 'both hips'],
      },
    },
    alpha: {
      pattern: /alpha[:\s]*(\d+\.?\d*)\s*(?:degrees|deg|\u00b0)?/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
    beta: {
      pattern: /beta[:\s]*(\d+\.?\d*)\s*(?:degrees|deg|\u00b0)?/i,
      group: 1,
      transform: (m) => parseFloat(m[1]),
    },
  },
};
