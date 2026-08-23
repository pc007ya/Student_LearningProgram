export interface OrbitGeometry {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

export interface Point {
  x: number;
  y: number;
}

export const TAU = Math.PI * 2;
export const AXIAL_TILT_RADIANS = 23.5 * Math.PI / 180;
export const SIDEREAL_ROTATIONS_PER_ORBIT = 366.2422;
export const SOLAR_DAYS_PER_ORBIT = 365.2422;
export const LUNAR_SIDEREAL_DAYS = 27.321661;
export const LUNAR_SIDEREAL_ORBITS_PER_EARTH_ORBIT = SOLAR_DAYS_PER_ORBIT / LUNAR_SIDEREAL_DAYS;

export function normalizeAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

export function orbitPosition(angle: number, orbit: OrbitGeometry): Point {
  return {
    x: orbit.centerX + Math.cos(angle) * orbit.radiusX,
    y: orbit.centerY + Math.sin(angle) * orbit.radiusY,
  };
}

export function pointerToOrbitAngle(point: Point, orbit: OrbitGeometry): number {
  const normalizedX = (point.x - orbit.centerX) / orbit.radiusX;
  const normalizedY = (point.y - orbit.centerY) / orbit.radiusY;
  return normalizeAngle(Math.atan2(normalizedY, normalizedX));
}

export function radiansToDegrees(angle: number): number {
  return Math.round(normalizeAngle(angle) * 180 / Math.PI);
}

export function shortestAngleDelta(next: number, current: number): number {
  const delta = normalizeAngle(next - current);
  return delta > Math.PI ? delta - TAU : delta;
}

export function earthRotationDeltaForOrbit(orbitDelta: number): number {
  return orbitDelta * SIDEREAL_ROTATIONS_PER_ORBIT;
}

export function earthTextureOffset(accumulatedTurns: number, textureWidth: number): number {
  return -accumulatedTurns * textureWidth;
}
