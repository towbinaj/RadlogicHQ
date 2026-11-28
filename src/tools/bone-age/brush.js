/**
 * Greulich & Pyle bone age interpretation by Brush Foundation standard
 * deviations.
 *
 * Source: Greulich WW, Pyle SI. Radiographic Atlas of Skeletal Development of
 *   the Hand and Wrist, 2nd ed. Stanford University Press, 1959 (Brush
 *   Foundation Study), as reproduced in Gilsanz V, Ratib O. Hand Bone Age: A
 *   Digital Atlas of Skeletal Maturity, Tables 1 (boys) and 2 (girls).
 *
 * Method (per that atlas): look up the SD for the patient's chronological age
 * and sex, interpolating between tabulated ages; the normal range is
 * chronological age +/- 2 SD. Bone age outside that range is advanced or
 * delayed. Used by both the G&P and Sontag tools.
 */

// [chronological age in months, SD of skeletal age in months]
export const BRUSH_SD = {
  male: [
    [3, 0.69], [6, 1.13], [9, 1.43], [12, 1.97], [18, 3.52],
    [24, 3.92], [30, 4.52], [36, 5.08], [42, 5.40], [48, 6.66],
    [54, 8.36], [60, 8.79], [72, 9.17], [84, 8.91], [96, 9.10],
    [108, 9.00], [120, 9.79], [132, 10.09], [144, 10.38], [156, 10.44],
    [168, 10.72], [180, 11.32], [192, 12.86], [204, 13.05],
  ],
  female: [
    [3, 0.72], [6, 1.16], [9, 1.36], [12, 1.77], [18, 3.49],
    [24, 4.64], [30, 5.37], [36, 5.97], [42, 7.48], [48, 8.98],
    [54, 10.73], [60, 11.65], [72, 10.23], [84, 9.64], [96, 10.23],
    [108, 10.74], [120, 11.73], [132, 11.94], [144, 10.24], [156, 10.67],
    [168, 11.30], [180, 9.23], [192, 7.31],
  ],
};

/** SD (months) for sex and chronological age in months; null if not covered. */
export function brushSD(sex, ageMonths) {
  const table = BRUSH_SD[sex];
  if (!table || ageMonths == null || !Number.isFinite(ageMonths)) return null;
  const first = table[0][0];
  const last = table[table.length - 1][0];
  if (ageMonths < first || ageMonths > last) return null;
  for (let i = 0; i < table.length; i++) {
    const [age, sd] = table[i];
    if (ageMonths === age) return sd;
    const [nextAge, nextSd] = table[i + 1] || [];
    if (nextAge != null && ageMonths > age && ageMonths < nextAge) {
      return sd + ((ageMonths - age) / (nextAge - age)) * (nextSd - sd);
    }
  }
  return null;
}

const signed = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;

/**
 * Interpret bone age against chronological age (both in months).
 * @returns {{ interpretation, level, sd, z, zLabel, normalRangeLabel, sdLabel, note }}
 */
export function interpretBoneAge(sex, chronoMonths, boneAgeMonths) {
  const empty = { interpretation: '', level: 0, sd: null, z: null, zLabel: '', normalRangeLabel: '', sdLabel: '', note: '' };
  if (chronoMonths == null || boneAgeMonths == null) return empty;
  if (!BRUSH_SD[sex]) {
    return { ...empty, note: 'Select sex to interpret against Greulich and Pyle standard deviations' };
  }
  const sd = brushSD(sex, chronoMonths);
  if (sd == null) {
    return { ...empty, note: 'Chronological age outside the Greulich and Pyle (Brush Foundation) reference range' };
  }
  const z = (boneAgeMonths - chronoMonths) / sd;
  const low = chronoMonths - 2 * sd;
  const high = chronoMonths + 2 * sd;
  let interpretation;
  let level;
  if (z > 2) { interpretation = `Advanced (${signed(z)} SD)`; level = 3; }
  else if (z < -2) { interpretation = `Delayed (${signed(z)} SD)`; level = 3; }
  else { interpretation = 'Within normal limits (within 2 SD)'; level = 1; }
  return {
    interpretation,
    level,
    sd,
    z,
    zLabel: `${signed(z)} SD`,
    normalRangeLabel: `${low.toFixed(1)}-${high.toFixed(1)} months`,
    sdLabel: `${sd.toFixed(2)} months`,
    note: '',
  };
}
