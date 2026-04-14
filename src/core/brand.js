// Brand asset paths.
//
// Single source of truth for logo / wordmark URLs so the rest of the app can
// import `BRAND.logoWhite` etc. If the files are renamed or moved, update
// this module once and every reference follows.
//
// Vite serves `public/` at the site root, so `/brand/foo.png` resolves to
// `public/brand/foo.png` on disk.

const base = '/brand';

export const BRAND = {
  // [R] bracket mark — square
  logoWhite: `${base}/logo-r-white.png`,
  logoBlack: `${base}/logo-r-black.png`,
  logoBlue:  `${base}/logo-r-blue.png`,

  // "RadioLogic HQ" serif wordmark
  wordmarkWhite: `${base}/wordmark-white.png`,
  wordmarkBlack: `${base}/wordmark-black.png`,
  wordmarkBlue:  `${base}/wordmark-blue.png`,

  // SVG favicon (navy tile + white [R]) lives at site root
  favicon: '/favicon.svg',
};
