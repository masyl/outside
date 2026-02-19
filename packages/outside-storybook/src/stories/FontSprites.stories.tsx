import { useState, useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ibmBiosManifest from '../../../../resources/sprites/fonts/IBM_BIOS_IBM/manifest.json';
import robotronManifest from '../../../../resources/sprites/fonts/Robotron_A7100_Square_Robotron/manifest.json';
import nix8810Manifest from '../../../../resources/sprites/fonts/Nix8810_M16_Nixdorf/manifest.json';
import fmtownsManifest from '../../../../resources/sprites/fonts/FMTowns_re_8x16_Fujitsu/manifest.json';

// ── Types ──────────────────────────────────────────────────────────────────

type SpriteEntry = {
  codePoint: string;
  unicodeName: string;
  file: string;
  charsets: string[];
  cp437Index?: number;
};

type FontManifest = {
  name: string;
  foundry: string;
  glyphWidth: number;
  glyphHeight: number;
  sprites: SpriteEntry[];
};

type FontEntry = {
  key: string;
  label: string;
  manifest: FontManifest;
  spriteRoot: string;
};

type TooltipState = {
  sprite: SpriteEntry;
  font: FontEntry;
  x: number;
  y: number;
};

// ── Font registry ──────────────────────────────────────────────────────────

const ALL_FONTS: FontEntry[] = [
  {
    key: 'ibm-bios',
    label: 'IBM BIOS',
    manifest: ibmBiosManifest as unknown as FontManifest,
    spriteRoot: '/resources/sprites/fonts/IBM_BIOS_IBM',
  },
  {
    key: 'robotron',
    label: 'Robotron A7100 Square',
    manifest: robotronManifest as unknown as FontManifest,
    spriteRoot: '/resources/sprites/fonts/Robotron_A7100_Square_Robotron',
  },
  {
    key: 'nix8810',
    label: 'Nix8810 M16',
    manifest: nix8810Manifest as unknown as FontManifest,
    spriteRoot: '/resources/sprites/fonts/Nix8810_M16_Nixdorf',
  },
  {
    key: 'fmtowns',
    label: 'FM Towns 8×16',
    manifest: fmtownsManifest as unknown as FontManifest,
    spriteRoot: '/resources/sprites/fonts/FMTowns_re_8x16_Fujitsu',
  },
];

// ── Demo texts ─────────────────────────────────────────────────────────────

const DEMO_TEXTS: Record<string, { label: string; lines: string[] }> = {
  'pangram-fox': {
    label: 'Pangram: Quick Brown Fox',
    lines: ['The quick brown fox jumps over the lazy dog'],
  },
  'pangram-pack': {
    label: 'Pangram: Pack My Box',
    lines: ['Pack my box with five dozen liquor jugs'],
  },
  'pangram-zebras': {
    label: 'Pangram: Vexing Zebras',
    lines: ['How vexingly quick daft zebras jump!'],
  },
  'pangram-wizards': {
    label: 'Pangram: Boxing Wizards',
    lines: ['The five boxing wizards jump quickly.'],
  },
  'quote-hamlet': {
    label: 'Quote: To Be or Not to Be',
    lines: [
      'To be, or not to be, that is the question:',
      "Whether 'tis nobler in the mind to suffer",
      'The slings and arrows of outrageous fortune,',
      'Or to take arms against a sea of troubles',
      'And by opposing end them.',
    ],
  },
  'quote-frost': {
    label: 'Poem: Two Roads — Robert Frost',
    lines: [
      'Two roads diverged in a yellow wood,',
      'And sorry I could not travel both',
      'And be one traveler, long I stood',
      'And looked down one as far as I could',
      'To where it bent in the undergrowth;',
    ],
  },
  'quote-dickens': {
    label: 'Opening: A Tale of Two Cities',
    lines: [
      'It was the best of times, it was the worst of times,',
      'it was the age of wisdom, it was the age of foolishness,',
      'it was the epoch of belief, it was the epoch of incredulity,',
      'it was the season of Light, it was the season of Darkness,',
      'it was the spring of hope, it was the winter of despair.',
    ],
  },
  'ascii-boxes': {
    label: 'ASCII Art: Box Drawing',
    lines: [
      '┌─────────────────────┐',
      '│  Hello, World!      │',
      '├─────────────────────┤',
      '│  ░░░░░░░░░░░░░░░░░  │',
      '│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │',
      '│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │',
      '│  █████████████████  │',
      '└─────────────────────┘',
    ],
  },
  'ascii-shading': {
    label: 'ASCII Art: Block Shading Gradient',
    lines: [
      '░░░░░░░░░░░░░░░░░░░░',
      '░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░',
      '░░▒▒▓▓▓▓▓▓▓▓▓▓▒▒░░',
      '░░▒▒▓▓████████▓▓▒▒░░',
      '░░▒▒▓▓████████▓▓▒▒░░',
      '░░▒▒▓▓▓▓▓▓▓▓▓▓▒▒░░',
      '░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░',
      '░░░░░░░░░░░░░░░░░░░░',
    ],
  },
  'ascii-emoticons': {
    label: 'ASCII Art: CP437 Symbols & Emoticons',
    lines: [
      '☺ ☻ ♥ ♦ ♣ ♠ • ◘ ○ ◙ ♂ ♀ ♪ ♫ ☼',
      '► ◄ ↕ ‼ ¶ § ▬ ↨ ↑ ↓ → ← ∟ ↔ ▲ ▼',
      '! " # $ % & \' ( ) * + , - . /',
      '0 1 2 3 4 5 6 7 8 9 : ; < = > ?',
      '@ A B C D E F G H I J K L M N O',
      'P Q R S T U V W X Y Z [ \\ ] ^ _',
    ],
  },
};

const PHRASE_OPTIONS: string[] = ['grid', ...Object.keys(DEMO_TEXTS)];

const PHRASE_LABELS: Record<string, string> = {
  grid: 'Full sprite grid',
  ...Object.fromEntries(Object.entries(DEMO_TEXTS).map(([k, v]) => [k, v.label])),
};

// ── Tooltip ────────────────────────────────────────────────────────────────

function Tooltip({ state }: { state: TooltipState }) {
  const { sprite, font, x, y } = state;
  return (
    <div
      style={{
        position: 'fixed',
        left: x + 14,
        top: y + 14,
        background: '#111',
        border: '1px solid #444',
        borderRadius: 4,
        padding: '8px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
        color: '#ddd',
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: 260,
        lineHeight: 1.7,
        boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 3 }}>
        {sprite.codePoint}
      </div>
      <div style={{ color: '#bbb' }}>{sprite.unicodeName}</div>
      {sprite.cp437Index !== undefined && (
        <div style={{ color: '#7799ff' }}>CP437 #{sprite.cp437Index}</div>
      )}
      <div style={{ color: '#666', marginTop: 4 }}>{sprite.charsets.join(', ')}</div>
      <div style={{ color: '#555' }}>
        {font.label} · {font.manifest.foundry}
      </div>
      <div style={{ color: '#444' }}>
        {font.manifest.glyphWidth}×{font.manifest.glyphHeight}px
      </div>
    </div>
  );
}

// ── Sprite cell ────────────────────────────────────────────────────────────

function SpriteCell({
  sprite,
  font,
  zoom,
  onHover,
}: {
  sprite: SpriteEntry;
  font: FontEntry;
  zoom: number;
  onHover: (state: TooltipState | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const w = font.manifest.glyphWidth * zoom;
  const h = font.manifest.glyphHeight * zoom;
  return (
    <img
      src={`${font.spriteRoot}/${sprite.file}`}
      width={w}
      height={h}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        cursor: 'default',
        backgroundColor: hovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        outline: hovered ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
        borderRadius: hovered ? 2 : 0,
      }}
      alt={sprite.codePoint}
      onMouseEnter={(e) => {
        setHovered(true);
        onHover({ sprite, font, x: e.clientX, y: e.clientY });
      }}
      onMouseMove={(e) => onHover({ sprite, font, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => {
        setHovered(false);
        onHover(null);
      }}
    />
  );
}

// ── Font grid ──────────────────────────────────────────────────────────────

function FontGrid({
  font,
  charsetFilter,
  zoom,
  onHover,
}: {
  font: FontEntry;
  charsetFilter: string;
  zoom: number;
  onHover: (state: TooltipState | null) => void;
}) {
  const filtered =
    charsetFilter === 'all'
      ? font.manifest.sprites
      : font.manifest.sprites.filter((s) => s.charsets.includes(charsetFilter));

  const w = font.manifest.glyphWidth * zoom;

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: 15 }}>
        {font.label}
        <span style={{ fontSize: 11, marginLeft: 12, color: '#555', fontWeight: 'normal' }}>
          {font.manifest.foundry} · {font.manifest.glyphWidth}×{font.manifest.glyphHeight}px ·{' '}
          {filtered.length} glyphs
        </span>
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {filtered.map((sprite) => (
          <div key={sprite.codePoint} style={{ width: w }}>
            <SpriteCell sprite={sprite} font={font} zoom={zoom} onHover={onHover} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Demo text ──────────────────────────────────────────────────────────────

function DemoText({
  font,
  lines,
  zoom,
  onHover,
}: {
  font: FontEntry;
  lines: string[];
  zoom: number;
  onHover: (state: TooltipState | null) => void;
}) {
  const byCodePoint = new Map<number, SpriteEntry>(
    font.manifest.sprites.map((s) => [parseInt(s.codePoint.slice(2), 16), s])
  );
  const w = font.manifest.glyphWidth * zoom;
  const h = font.manifest.glyphHeight * zoom;

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: 15 }}>
        {font.label}
        <span style={{ fontSize: 11, marginLeft: 12, color: '#555', fontWeight: 'normal' }}>
          {font.manifest.foundry} · {font.manifest.glyphWidth}×{font.manifest.glyphHeight}px
        </span>
      </h2>
      <div>
        {lines.map((line, li) => (
          <div key={li} style={{ display: 'flex', marginBottom: 2 }}>
            {[...line].map((char, ci) => {
              const cp = char.codePointAt(0) ?? 32;
              const sprite = byCodePoint.get(cp);
              if (!sprite) {
                return <div key={ci} style={{ width: w, height: h, display: 'inline-block' }} />;
              }
              return <SpriteCell key={ci} sprite={sprite} font={font} zoom={zoom} onHover={onHover} />;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Font Browser ───────────────────────────────────────────────────────────

type BrowserProps = {
  fontFilter: string;
  charsetFilter: string;
  phrase: string;
  zoom: number;
};

function FontBrowser({ fontFilter, charsetFilter, phrase, zoom }: BrowserProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const handleHover = useCallback((state: TooltipState | null) => setTooltip(state), []);

  const fonts =
    fontFilter === 'all' ? ALL_FONTS : ALL_FONTS.filter((f) => f.key === fontFilter);
  const isGrid = phrase === 'grid';
  const demo = !isGrid ? DEMO_TEXTS[phrase] : null;

  return (
    <div
      style={{
        fontFamily: 'monospace',
        padding: 20,
        background: '#1a1a1a',
        color: '#ccc',
        minHeight: '100vh',
      }}
    >
      {fonts.map((font) =>
        isGrid ? (
          <FontGrid
            key={font.key}
            font={font}
            charsetFilter={charsetFilter}
            zoom={zoom}
            onHover={handleHover}
          />
        ) : (
          <DemoText
            key={font.key}
            font={font}
            lines={demo?.lines ?? []}
            zoom={zoom}
            onHover={handleHover}
          />
        )
      )}
      {tooltip && <Tooltip state={tooltip} />}
    </div>
  );
}

// ── Storybook meta ─────────────────────────────────────────────────────────

const meta: Meta<typeof FontBrowser> = {
  title: 'FONTS/Font Browser',
  component: FontBrowser,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    fontFilter: {
      name: 'Font',
      control: {
        type: 'select',
        labels: {
          all: 'All fonts',
          ...Object.fromEntries(ALL_FONTS.map((f) => [f.key, f.label])),
        },
      },
      options: ['all', ...ALL_FONTS.map((f) => f.key)],
    },
    charsetFilter: {
      name: 'Charset',
      control: {
        type: 'select',
        labels: { all: 'All sets', cp437: 'CP437 (DOS)', plus: 'Extended Unicode (Plus)' },
      },
      options: ['all', 'cp437', 'plus'],
    },
    phrase: {
      name: 'Display',
      control: {
        type: 'select',
        labels: PHRASE_LABELS,
      },
      options: PHRASE_OPTIONS,
    },
    zoom: {
      name: 'Zoom',
      control: { type: 'range', min: 1, max: 10, step: 1 },
    },
  },
  args: {
    fontFilter: 'all',
    charsetFilter: 'all',
    phrase: 'grid',
    zoom: 2,
  },
};

export default meta;

/** Interactive font browser — use the controls panel to filter by font, charset, and display mode. */
export const Browser: StoryObj<typeof FontBrowser> = {};
