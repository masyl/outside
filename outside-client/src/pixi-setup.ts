import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';

export function setupPixiReact() {
  extend({
    Container,
    Graphics,
    Sprite,
    Text,
    TilingSprite,
    PixiText: Text, // Alias for <pixiText> usage
  });
}
