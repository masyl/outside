/** Base sprite key used by soccer-ball entities. */
export const SOCCER_BALL_SPRITE_KEY = 'pickup.ball.soccer';

/**
 * Ballgen sheet layout for `examples/blue-ball.all.png`.
 *
 * The upstream generator composes an N x N grid where rows are elevation steps
 * and columns are roll steps (`make_sprites.py`). The provided sheet is 1024 x 1024
 * with 8 x 8 frames, so each frame is 128 x 128.
 */
export const SOCCER_BALL_SHEET_LAYOUT = {
  columns: 8,
  rows: 8,
  frameWidth: 128,
  frameHeight: 128,
} as const;
