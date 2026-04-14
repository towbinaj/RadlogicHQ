// Brand asset paths.
//
// Files currently live under /images/ with camera-upload names (IMG_46xx.png).
// This module is the single place that maps those to meaningful names so the
// rest of the app can import `BRAND.logoWhite` etc. When the raw files are
// renamed in the repo, only this file needs updating.
//
// Vite serves `public/` at the site root, so `/images/foo.png` resolves to
// `public/images/foo.png` on disk.

const base = '/images';

export const BRAND = {
  // [R] bracket mark — square, 1024x1024 source
  logoWhite: `${base}/IMG_4684.png`,
  logoBlack: `${base}/IMG_4685.png`,
  logoBlue:  `${base}/IMG_4691.png`,

  // "RadioLogic HQ" serif wordmark — 1536x1024 source
  wordmarkWhite: `${base}/IMG_4689.png`,
  wordmarkBlack: `${base}/IMG_4688.png`,
  wordmarkBlue:  `${base}/IMG_4690.png`,
};
