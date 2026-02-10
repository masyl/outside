import { describe, it, expect } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { DefaultSpriteKey, VariantSpriteKey } from '@outside/simulator';
import { createRenderWorld } from './render-world';
import { classifyRenderKind, resolveSpriteKey } from './render-classify';

function makeWorld() {
  return createRenderWorld().world;
}

describe('classifyRenderKind', () => {
  it('classifies known sprite keys', () => {
    const world = makeWorld();
    const entries = [
      ['tile.floor', 'floor'],
      ['tile.wall', 'wall'],
      ['actor.bot', 'bot'],
      ['actor.hero', 'hero'],
      ['pickup.food', 'food'],
      ['pickup.ball.soccer', 'ball'],
      ['ui.cursor.r0c0', 'pointer'],
    ] as const;

    for (const [key, expected] of entries) {
      const eid = addEntity(world);
      addComponent(world, eid, DefaultSpriteKey);
      DefaultSpriteKey.value[eid] = key;
      expect(classifyRenderKind(world, eid)).toBe(expected);
    }
  });

  it('uses variant key before default key', () => {
    const world = makeWorld();
    const eid = addEntity(world);
    addComponent(world, eid, DefaultSpriteKey);
    DefaultSpriteKey.value[eid] = 'actor.bot';
    addComponent(world, eid, VariantSpriteKey);
    VariantSpriteKey.value[eid] = 'pickup.food';
    expect(resolveSpriteKey(world, eid)).toBe('pickup.food');
    expect(classifyRenderKind(world, eid)).toBe('food');
  });

  it('treats food variant sprite keys as food even if not listed explicitly', () => {
    const world = makeWorld();
    const eid = addEntity(world);
    addComponent(world, eid, DefaultSpriteKey);
    DefaultSpriteKey.value[eid] = 'pickup.food';
    addComponent(world, eid, VariantSpriteKey);
    VariantSpriteKey.value[eid] = 'pickup.food.custom-variant';
    expect(classifyRenderKind(world, eid)).toBe('food');
  });

  it('treats soccer-ball sprite key prefixes as ball kind', () => {
    const world = makeWorld();
    const eid = addEntity(world);
    addComponent(world, eid, DefaultSpriteKey);
    DefaultSpriteKey.value[eid] = 'pickup.ball.soccer';
    addComponent(world, eid, VariantSpriteKey);
    VariantSpriteKey.value[eid] = 'pickup.ball.soccer.custom';
    expect(classifyRenderKind(world, eid)).toBe('ball');
  });

  it('treats actor variant sprite key prefixes as bot/hero kinds', () => {
    const world = makeWorld();

    const bot = addEntity(world);
    addComponent(world, bot, DefaultSpriteKey);
    DefaultSpriteKey.value[bot] = 'actor.bot';
    addComponent(world, bot, VariantSpriteKey);
    VariantSpriteKey.value[bot] = 'actor.bot.golden-retriever';
    expect(classifyRenderKind(world, bot)).toBe('bot');

    const catBot = addEntity(world);
    addComponent(world, catBot, DefaultSpriteKey);
    DefaultSpriteKey.value[catBot] = 'actor.bot';
    addComponent(world, catBot, VariantSpriteKey);
    VariantSpriteKey.value[catBot] = 'actor.bot.beige-cat';
    expect(classifyRenderKind(world, catBot)).toBe('bot');

    const hero = addEntity(world);
    addComponent(world, hero, DefaultSpriteKey);
    DefaultSpriteKey.value[hero] = 'actor.hero';
    addComponent(world, hero, VariantSpriteKey);
    VariantSpriteKey.value[hero] = 'actor.hero.golden-retriever';
    expect(classifyRenderKind(world, hero)).toBe('hero');

    const catHero = addEntity(world);
    addComponent(world, catHero, DefaultSpriteKey);
    DefaultSpriteKey.value[catHero] = 'actor.hero';
    addComponent(world, catHero, VariantSpriteKey);
    VariantSpriteKey.value[catHero] = 'actor.hero.beige-cat';
    expect(classifyRenderKind(world, catHero)).toBe('hero');
  });

  it('falls back to error when no known key exists', () => {
    const world = makeWorld();
    const missing = addEntity(world);
    expect(classifyRenderKind(world, missing)).toBe('error');

    const unknown = addEntity(world);
    addComponent(world, unknown, DefaultSpriteKey);
    DefaultSpriteKey.value[unknown] = 'unknown.key';
    expect(classifyRenderKind(world, unknown)).toBe('error');
  });
});
