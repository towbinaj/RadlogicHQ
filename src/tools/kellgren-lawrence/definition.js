/**
 * Kellgren-Lawrence OA Grading Scale — definition.
 *
 * Reference: Kellgren JH, Lawrence JS. Ann Rheum Dis 1957;16(4):494-502.
 */

export const klDefinition = {
  id: 'kellgren-lawrence',
  name: 'Kellgren-Lawrence',

  grades: [
    { id: '0', label: 'Grade 0 — Normal', findings: 'No radiographic features of OA' },
    { id: '1', label: 'Grade 1 — Doubtful', findings: 'Minute osteophytes of doubtful significance' },
    { id: '2', label: 'Grade 2 — Minimal', findings: 'Definite osteophytes, normal joint space' },
    { id: '3', label: 'Grade 3 — Moderate', findings: 'Moderate joint space narrowing' },
    { id: '4', label: 'Grade 4 — Severe', findings: 'Severe joint space narrowing, subchondral sclerosis, definite deformity' },
  ],

  jointOptions: [
    { id: 'knee', label: 'Knee' },
    { id: 'hip', label: 'Hip' },
    { id: 'hand', label: 'Hand' },
    { id: 'spine', label: 'Spine' },
    { id: 'other', label: 'Other' },
  ],

  sideOptions: [
    { id: 'right', label: 'Right' },
    { id: 'left', label: 'Left' },
    { id: 'bilateral', label: 'Bilateral' },
  ],

  // Bilateral pastes like "Right knee: KL 3. Left knee: KL 2." split
  // into per-side segments so each side carries its own grade.
  // Joint is study-level (the whole exam is usually one joint type).
  parseSegmentation: { type: 'laterality' },

  parseRules: {
    grade: {
      options: {
        '0': ['kl 0', 'kl grade 0', 'kellgren-lawrence 0', 'kellgren lawrence 0', 'grade 0', 'normal'],
        '1': ['kl 1', 'kl grade 1', 'kellgren-lawrence 1', 'kellgren lawrence 1', 'grade 1', 'doubtful'],
        '2': ['kl 2', 'kl grade 2', 'kellgren-lawrence 2', 'kellgren lawrence 2', 'grade 2', 'minimal'],
        '3': ['kl 3', 'kl grade 3', 'kellgren-lawrence 3', 'kellgren lawrence 3', 'grade 3', 'moderate'],
        '4': ['kl 4', 'kl grade 4', 'kellgren-lawrence 4', 'kellgren lawrence 4', 'grade 4', 'severe'],
      },
    },
    joint: {
      options: {
        knee: ['knee'],
        hip: ['hip'],
        hand: ['hand', 'finger', 'wrist'],
        spine: ['spine', 'lumbar', 'cervical', 'thoracic'],
        other: ['ankle', 'shoulder', 'elbow'],
      },
    },
    side: {
      options: {
        right: ['right'],
        left: ['left'],
        bilateral: ['bilateral', 'both'],
      },
    },
  },
};
