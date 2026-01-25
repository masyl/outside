import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      container: any;
      graphics: any;
      sprite: any;
      pixiText: any;
      tilingSprite: any;
    }
  }
}
