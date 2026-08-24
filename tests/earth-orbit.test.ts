import { describe, expect, it } from 'vitest';
import { AXIAL_TILT_RADIANS, earthRotationDeltaForOrbit, localSolarTimeFromRotation, LUNAR_SIDEREAL_DAYS, LUNAR_SIDEREAL_ORBITS_PER_EARTH_ORBIT, normalizeAngle, orbitPosition, orbitProgressFromAngle, pointerToOrbitAngle, shortestAngleDelta, SIDEREAL_ROTATIONS_PER_ORBIT, SOLAR_DAYS_PER_ORBIT, TAU } from '../src/modules/earth-orbit/orbitMath';

const orbit = { centerX: 600, centerY: 337.5, radiusX: 430, radiusY: 218 };

describe('Earth Orbit V0.1 math', () => {
  it('keeps calculated positions on the ellipse', () => {
    for (const angle of [0, Math.PI / 3, Math.PI, Math.PI * 1.7]) {
      const point = orbitPosition(angle, orbit);
      const ellipse = ((point.x - orbit.centerX) / orbit.radiusX) ** 2
        + ((point.y - orbit.centerY) / orbit.radiusY) ** 2;
      expect(ellipse).toBeCloseTo(1, 10);
    }
  });

  it('maps pointer positions back to the same orbit angle', () => {
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      expect(pointerToOrbitAngle(orbitPosition(angle, orbit), orbit)).toBeCloseTo(normalizeAngle(angle), 10);
    }
  });

  it('normalizes angles without coupling them to another state value', () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
    expect(normalizeAngle(TAU + 0.25)).toBeCloseTo(0.25);
  });

  it('keeps the axial tilt fixed at 23.5 degrees', () => {
    expect(AXIAL_TILT_RADIANS * 180 / Math.PI).toBeCloseTo(23.5, 10);
  });

  it('couples rotation to signed orbit travel instead of wall-clock time', () => {
    expect(earthRotationDeltaForOrbit(TAU) / TAU).toBeCloseTo(SIDEREAL_ROTATIONS_PER_ORBIT, 8);
    expect(SIDEREAL_ROTATIONS_PER_ORBIT - SOLAR_DAYS_PER_ORBIT).toBeCloseTo(1, 8);
    expect(earthRotationDeltaForOrbit(-0.25)).toBeLessThan(0);
  });

  it('uses the shortest signed delta while dragging across angle zero', () => {
    expect(shortestAngleDelta(0.05, TAU - 0.05)).toBeCloseTo(0.1, 10);
    expect(shortestAngleDelta(TAU - 0.05, 0.05)).toBeCloseTo(-0.1, 10);
  });

  it('maps a dragged orbital position to a stable point in the model year', () => {
    expect(orbitProgressFromAngle(0)).toBe(0);
    expect(orbitProgressFromAngle(Math.PI / 2)).toBeCloseTo(0.25, 10);
    expect(orbitProgressFromAngle(Math.PI)).toBeCloseTo(0.5, 10);
    expect(orbitProgressFromAngle(Math.PI * 1.5)).toBeCloseTo(0.75, 10);
    expect(orbitProgressFromAngle(-Math.PI / 2)).toBeCloseTo(0.75, 10);
  });

  it('advances the Moon by its sidereal orbit ratio', () => {
    expect(LUNAR_SIDEREAL_ORBITS_PER_EARTH_ORBIT).toBeCloseTo(13.368228, 6);
    expect(LUNAR_SIDEREAL_DAYS).toBeCloseTo(27.32166, 4);
  });

  it('maps one Earth rotation to a 24-hour clock at the same location', () => {
    expect(localSolarTimeFromRotation(0)).toEqual({ hour: 12, minute: 0, isDaytime: true });
    expect(localSolarTimeFromRotation(Math.PI / 2)).toEqual({ hour: 18, minute: 0, isDaytime: false });
    expect(localSolarTimeFromRotation(Math.PI)).toEqual({ hour: 0, minute: 0, isDaytime: false });
    expect(localSolarTimeFromRotation(Math.PI * 1.5)).toEqual({ hour: 6, minute: 0, isDaytime: true });
    expect(localSolarTimeFromRotation(TAU)).toEqual({ hour: 12, minute: 0, isDaytime: true });
  });

});
