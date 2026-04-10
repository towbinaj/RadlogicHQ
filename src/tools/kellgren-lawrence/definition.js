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

  parseRules: {},
};
