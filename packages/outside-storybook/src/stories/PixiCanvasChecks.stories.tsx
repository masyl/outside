import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { PixiCanvasStory } from '../components/renderer/PixiCanvasStory';

function FullHeightDecorator(Story: React.ComponentType) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Story />
    </div>
  );
}

const meta: Meta<typeof PixiCanvasStory> = {
  title: 'Renderer/Pixi Canvas Checks',
  component: PixiCanvasStory,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Pixi primitive rendering checks for debugging canvas output.',
      },
    },
  },
  argTypes: {
    draw: { table: { disable: true } },
    width: { control: { type: 'number', min: 200, step: 50 } },
    height: { control: { type: 'number', min: 200, step: 50 } },
  },
};

export default meta;

const baseTextStyle = new TextStyle({
  fill: 0xffffff,
  fontFamily: 'monospace',
  fontSize: 14,
  stroke: { color: 0x000000, width: 2 },
});

export const SolidRect: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const g = new Graphics();
      g.rect(40, 40, 300, 200).fill(0x4fe3c1);
      app.stage.addChild(g);
    },
  },
};

export const GridLines: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const g = new Graphics();
      const size = 40;
      g.stroke({ color: 0x8aa4c1, width: 1, alpha: 0.6 });
      for (let x = 0; x <= 800; x += size) {
        g.moveTo(x, 0).lineTo(x, 600);
      }
      for (let y = 0; y <= 600; y += size) {
        g.moveTo(0, y).lineTo(800, y);
      }
      app.stage.addChild(g);
    },
  },
};

export const CirclesPalette: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const colors = [0xff6b6b, 0xfeca57, 0x48dbfb, 0x1dd1a1, 0x5f27cd];
      const g = new Graphics();
      colors.forEach((color, index) => {
        g.circle(120 + index * 120, 150, 45).fill(color);
      });
      app.stage.addChild(g);
    },
  },
};

export const StrokeAndFill: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const g = new Graphics();
      g.rect(60, 60, 220, 140).fill(0x1f7aed).stroke({ color: 0xffffff, width: 3 });
      g.roundRect(330, 60, 220, 140, 16).fill(0xffc857).stroke({ color: 0x1c1c1c, width: 2 });
      app.stage.addChild(g);
    },
  },
};

export const LinesAndArrows: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const g = new Graphics();
      g.stroke({ color: 0x9b59b6, width: 4 });
      g.moveTo(80, 200).lineTo(320, 120).lineTo(520, 220);

      g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.7 });
      g.moveTo(80, 260).lineTo(520, 260);

      g.stroke({ color: 0xf1c40f, width: 3 });
      g.moveTo(100, 320).lineTo(520, 360);

      // Arrowheads
      g.stroke({ color: 0x9b59b6, width: 4 });
      g.moveTo(520, 220).lineTo(500, 210);
      g.moveTo(520, 220).lineTo(505, 235);

      g.stroke({ color: 0xe74c3c, width: 2, alpha: 0.7 });
      g.moveTo(520, 260).lineTo(505, 250);
      g.moveTo(520, 260).lineTo(505, 270);

      g.stroke({ color: 0xf1c40f, width: 3 });
      g.moveTo(520, 360).lineTo(505, 350);
      g.moveTo(520, 360).lineTo(505, 370);
      app.stage.addChild(g);
    },
  },
};

export const PolygonStar: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const g = new Graphics();
      g.star(280, 200, 5, 90).fill(0xf39c12).stroke({ color: 0xffffff, width: 2 });
      app.stage.addChild(g);
    },
  },
};

export const TextOverlay: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const text = new Text({
        text: 'Pixi Text Overlay',
        style: baseTextStyle,
      });
      text.x = 40;
      text.y = 40;
      app.stage.addChild(text);
    },
  },
};

export const SpriteTinted: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const sprite = new Sprite(Texture.WHITE);
      sprite.tint = 0x00c2ff;
      sprite.width = 160;
      sprite.height = 160;
      sprite.x = 60;
      sprite.y = 60;
      app.stage.addChild(sprite);
    },
  },
};

export const ZIndexLayers: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const container = new Container();
      container.sortableChildren = true;

      const back = new Graphics();
      back.rect(60, 60, 260, 180).fill(0x1abc9c);
      back.zIndex = 0;

      const front = new Graphics();
      front.rect(140, 100, 260, 180).fill(0xe74c3c);
      front.zIndex = 2;

      container.addChild(back);
      container.addChild(front);
      app.stage.addChild(container);
    },
  },
};

export const AlphaBlend: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const g = new Graphics();
      g.rect(80, 80, 200, 160).fill(0x3498db);
      g.rect(160, 140, 200, 160).fill({ color: 0xe74c3c, alpha: 0.6 });
      app.stage.addChild(g);
    },
  },
};

export const MaskClip: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const container = new Container();
      const g = new Graphics();
      g.rect(40, 40, 320, 220).fill(0x9b59b6);
      const mask = new Graphics();
      mask.circle(200, 150, 80).fill(0xffffff);
      container.addChild(g);
      container.mask = mask;
      app.stage.addChild(container);
      app.stage.addChild(mask);
    },
  },
};

export const RotatedSprite: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const sprite = new Sprite(Texture.WHITE);
      sprite.tint = 0xffd166;
      sprite.width = 200;
      sprite.height = 80;
      sprite.x = 200;
      sprite.y = 200;
      sprite.rotation = Math.PI / 6;
      app.stage.addChild(sprite);
    },
  },
};

export const ContainerTransform: StoryObj<typeof PixiCanvasStory> = {
  args: {
    draw: (app: Application) => {
      const container = new Container();
      container.x = 200;
      container.y = 200;
      container.scale.set(1.2);

      const g = new Graphics();
      g.rect(0, 0, 120, 120).fill(0x2ecc71);
      container.addChild(g);

      const text = new Text({ text: 'Group', style: baseTextStyle });
      text.x = 10;
      text.y = 10;
      container.addChild(text);

      app.stage.addChild(container);
    },
  },
};
