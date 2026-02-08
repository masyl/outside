import botIconUrl from '@hackernoon/pixel-icon-library/icons/PNG/for-light-mode/24px/solid/robot.png';
import heroIconUrl from '@hackernoon/pixel-icon-library/icons/PNG/for-light-mode/24px/solid/user.png';
import foodIconUrl from '@hackernoon/pixel-icon-library/icons/PNG/for-light-mode/24px/brands/apple.png';

export const DEFAULT_ICON_URLS = {
  bot: botIconUrl,
  hero: heroIconUrl,
  food: foodIconUrl,
};

export type DefaultIconKind = keyof typeof DEFAULT_ICON_URLS;
