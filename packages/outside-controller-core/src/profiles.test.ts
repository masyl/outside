import { describe, expect, it } from 'vitest';
import { detectControllerFamily, resolveControllerProfile } from './profiles';

describe('profiles', () => {
  it('detects xbox-like family from xbox id', () => {
    const family = detectControllerFamily('Xbox Wireless Controller');
    expect(family).toBe('xbox-like');
  });

  it('detects playstation-like family from dualsense id', () => {
    const family = detectControllerFamily(
      'Sony Interactive Entertainment DualSense Wireless Controller'
    );
    expect(family).toBe('playstation-like');
  });

  it('detects nintendo-like family from switch id', () => {
    const family = detectControllerFamily('Nintendo Switch Pro Controller');
    expect(family).toBe('nintendo-like');
  });

  it('falls back to xbox-like when mapping is standard', () => {
    const family = detectControllerFamily('Unknown HID Device', 'standard');
    expect(family).toBe('xbox-like');
  });

  it('uses preferred family override when provided', () => {
    const profile = resolveControllerProfile(
      'Sony Interactive Entertainment DualSense Wireless Controller',
      'standard',
      'nintendo-like'
    );

    expect(profile.family).toBe('nintendo-like');
    expect(profile.faceLabels.south).toBe('B');
  });
});
