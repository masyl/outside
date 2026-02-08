import botIconUrl from '@hackernoon/pixel-icon-library/icons/PNG/for-dark-mode/24px/solid/robot.png';
import heroIconUrl from '@hackernoon/pixel-icon-library/icons/PNG/for-dark-mode/24px/solid/user.png';
import foodIconUrl from '@hackernoon/pixel-icon-library/icons/PNG/for-dark-mode/24px/brands/apple.png';

/**
 * Built-in icon fallback URLs used before full spritesheet coverage exists.
 */
export const DEFAULT_ICON_URLS = {
  bot: botIconUrl,
  hero: heroIconUrl,
  food: foodIconUrl,
};

/** Available icon keys in {@link DEFAULT_ICON_URLS}. */
export type DefaultIconKind = keyof typeof DEFAULT_ICON_URLS;
