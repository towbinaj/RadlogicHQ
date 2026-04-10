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
    { id: 'Ia', label: 'Type Ia — Mature', description: 'Alpha ≥60\u00b0, beta <55\u00b0. Normal hip.' },
    { id: 'Ib', label: 'Type Ib — Mature', description: 'Alpha ≥60\u00b0, beta 55\u00b0-77\u00b0. Normal hip, broad cartilaginous roof.' },
    { id: 'IIa-plus', label: 'Type IIa+ — Immature (age-appropriate)', description: 'Alpha 50\u00b0-59\u00b0, age <3 months. Physiologic immaturity, follow-up.' },
    { id: 'IIa-minus', label: 'Type IIa\u2212 — Immature (delayed)', description: 'Alpha 50\u00b0-59\u00b0, age >3 months. Deficient bony acetabulum.' },
    { id: 'IIb', label: 'Type IIb — Deficient', description: 'Alpha 50\u00b0-59\u00b0, age >3 months. Ossification deficit, needs treatment.' },
    { id: 'IIc', label: 'Type IIc — Critical', description: 'Alpha 43\u00b0-49\u00b0, beta <77\u00b0. Critical range, close to subluxation.' },
    { id: 'D', label: 'Type D — Decentering', description: 'Alpha 43\u00b0-49\u00b0, beta >77\u00b0. Femoral head decentering.' },
    { id: 'IIIa', label: 'Type IIIa — Eccentric', description: 'Alpha <43\u00b0. Femoral head displaced, hyaline cartilage preserved.' },
    { id: 'IIIb', label: 'Type IIIb — Eccentric', description: 'Alpha <43\u00b0. Femoral head displaced, cartilage degenerated.' },
    { id: 'IV', label: 'Type IV — Dislocated', description: 'Alpha <43\u00b0. Complete dislocation, labrum interposed.' },
  ],

  aaosCategories: [
    { id: 'normal', label: 'Normal', description: 'No dysplasia; normal acetabular coverage' },
    { id: 'dysplastic', label: 'Dysplastic', description: 'Shallow acetabulum; femoral head contained but undercovered' },
    { id: 'subluxed', label: 'Subluxed', description: 'Femoral head partially displaced from acetabulum' },
    { id: 'dislocated', label: 'Dislocated', description: 'Femoral head completely out of acetabulum' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  parseRules: {},
};
