import { ControllerFamily, ControllerProfile, FaceButtonLabels } from './types';

const XBOX_FACE_LABELS: FaceButtonLabels = {
  south: 'A',
  east: 'B',
  west: 'X',
  north: 'Y',
};

const PLAYSTATION_FACE_LABELS: FaceButtonLabels = {
  south: 'Cross',
  east: 'Circle',
  west: 'Square',
  north: 'Triangle',
};

const NINTENDO_FACE_LABELS: FaceButtonLabels = {
  south: 'B',
  east: 'A',
  west: 'Y',
  north: 'X',
};

const GENERIC_FACE_LABELS: FaceButtonLabels = {
  south: 'South',
  east: 'East',
  west: 'West',
  north: 'North',
};

export const XBOX_LIKE_PROFILE: ControllerProfile = {
  key: 'xbox-like',
  family: 'xbox-like',
  faceLayout: 'xbox',
  faceLabels: XBOX_FACE_LABELS,
};

export const PLAYSTATION_LIKE_PROFILE: ControllerProfile = {
  key: 'playstation-like',
  family: 'playstation-like',
  faceLayout: 'playstation',
  faceLabels: PLAYSTATION_FACE_LABELS,
};

export const NINTENDO_LIKE_PROFILE: ControllerProfile = {
  key: 'nintendo-like',
  family: 'nintendo-like',
  faceLayout: 'nintendo',
  faceLabels: NINTENDO_FACE_LABELS,
};

export const GENERIC_PROFILE: ControllerProfile = {
  key: 'generic',
  family: 'generic',
  faceLayout: 'generic',
  faceLabels: GENERIC_FACE_LABELS,
};

export const DEFAULT_PROFILES: Record<ControllerFamily, ControllerProfile> = {
  'xbox-like': XBOX_LIKE_PROFILE,
  'playstation-like': PLAYSTATION_LIKE_PROFILE,
  'nintendo-like': NINTENDO_LIKE_PROFILE,
  generic: GENERIC_PROFILE,
};

const XBOX_ID_HINTS = ['xbox', 'xinput', 'microsoft', '8bitdo', 'powera', 'razer'];
const PLAYSTATION_ID_HINTS = ['dualsense', 'dualsense edge', 'dualshock', 'playstation', 'sony'];
const NINTENDO_ID_HINTS = ['nintendo', 'switch', 'joy-con', 'pro controller', 'horipad'];

function includesAny(value: string, hints: readonly string[]): boolean {
  return hints.some((hint) => value.includes(hint));
}

export function detectControllerFamily(id: string, mapping: string = ''): ControllerFamily {
  const normalizedId = id.toLowerCase();
  const normalizedMapping = mapping.toLowerCase();

  if (includesAny(normalizedId, PLAYSTATION_ID_HINTS)) {
    return 'playstation-like';
  }
  if (includesAny(normalizedId, NINTENDO_ID_HINTS)) {
    return 'nintendo-like';
  }
  if (includesAny(normalizedId, XBOX_ID_HINTS)) {
    return 'xbox-like';
  }

  if (normalizedMapping === 'standard') {
    return 'xbox-like';
  }

  return 'generic';
}

export function resolveControllerProfile(
  id: string,
  mapping?: string,
  preferredFamily?: ControllerFamily
): ControllerProfile {
  if (preferredFamily != null) {
    return DEFAULT_PROFILES[preferredFamily];
  }

  const family = detectControllerFamily(id, mapping);
  return DEFAULT_PROFILES[family];
}
