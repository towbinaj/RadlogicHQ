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

  // Favicons (logo-r-white composited onto #1a1a2e tile) at site root
  favicon32:       '/favicon-32.png',
  favicon192:      '/favicon-192.png',
  favicon512:      '/favicon-512.png',
  appleTouchIcon:  '/apple-touch-icon.png',
};
