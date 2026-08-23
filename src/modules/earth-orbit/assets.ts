export const EARTH_ORBIT_ASSETS = {
  background: 'images/science/earth-orbit/v0.1/background/space-clean-v01.png',
  sun: 'images/science/earth-orbit/v0.1/bodies/sun-v01.png',
  earth: 'images/science/earth-orbit/v0.1/bodies/earth-v01.png',
  earthSurface: 'images/science/earth-orbit/v0.1/bodies/earth-surface-equirect-v02.png',
  moon: 'images/science/earth-orbit/v0.1/bodies/moon-v01.png',
  orbit: 'images/science/earth-orbit/v0.1/guides/orbit-guide-v01.svg',
  overlay: 'images/science/earth-orbit/v0.1/guides/interaction-overlay-v01.svg',
  seasonMarkers: 'images/science/earth-orbit/v0.1/guides/season-markers-v01.svg',
} as const;

export type EarthOrbitAssetKey = keyof typeof EARTH_ORBIT_ASSETS;
