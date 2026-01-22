import React, { useMemo } from 'react';
import { TextStyle } from 'pixi.js';
import { useApplication } from '@pixi/react';
import { useKeystrokeState } from '../debug/keystrokeStore';

interface KeystrokeEntry {
  keys: string[];
  description: string;
  category?: string;
}

const KEYSTROKES: KeystrokeEntry[] = [
  {
    keys: ['?', 'ESC'],
    description: 'Toggle this help menu',
  },
  {
    keys: ['Alt + D', 'Alt + Esc'],
    description: 'Toggle debug panel',
    category: 'Debug',
  },
  {
    keys: ['Shift + G'],
    description: 'Toggle sub-grid (8x8) in debug mode',
    category: 'Debug',
  },
  {
    keys: ['Tab', 'Shift+Tab'],
    description: 'Cycle to next/previous bot',
    category: 'Bot Selection',
  },
  {
    keys: ['↑', '↓', '←', '→'],
    description: 'Move selected bot',
    category: 'Bot Movement',
  },
  {
    keys: ['Alt + R'],
    description: 'Full reset (clear events, reset step count, reinitialize level)',
    category: 'Debug',
  },
  {
    keys: ['Alt + F'],
    description: 'Freeze/Unfreeze bots',
    category: 'Debug',
  },
  {
    keys: ['Alt + Space'],
    description: 'Toggle play/pause',
    category: 'Timeline',
  },
  {
    keys: ['Alt + ↑', 'Alt + ↓'],
    description: 'Step forward/backward one event',
    category: 'Timeline',
  },
  {
    keys: ['Alt + ←', 'Alt + →'],
    description: 'Scrub timeline (1 second)',
    category: 'Timeline',
  },
  {
    keys: ['Alt + Home'],
    description: 'Time travel to level start (after initialization)',
    category: 'Timeline',
  },
  {
    keys: ['Alt + End'],
    description: 'Time travel to end of history',
    category: 'Timeline',
  },
];

export const KeystrokeHelp: React.FC = () => {
  const { app } = useApplication();
  const { visible } = useKeystrokeState();

  const width = 600;
  const height = 500;

  // Center position
  const x = app ? (app.screen.width - width) / 2 : 0;
  const y = app ? (app.screen.height - height) / 2 : 0;

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: 'monospace',
        fontSize: 24,
        fill: '#00ff00',
        fontWeight: 'bold',
      }),
    []
  );

  const keyStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: 'monospace',
        fontSize: 16,
        fill: '#00ff00',
        fontWeight: 'bold',
      }),
    []
  );

  const descStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: 'monospace',
        fontSize: 16,
        fill: '#00ff00',
      }),
    []
  );

  const noteStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: 'monospace',
        fontSize: 14,
        fill: '#888888',
        fontStyle: 'italic',
      }),
    []
  );

  if (!visible || !app) return null;

  return (
    <container x={x} y={y} zIndex={10002}>
      {/* Background */}
      <graphics
        draw={(g: any) => {
          g.clear();
          g.rect(0, 0, width, height);
          g.fill({ color: 0x000000, alpha: 0.95 });
          g.stroke({ width: 2, color: 0x00ff00 });
        }}
      />

      {/* Content Container */}
      <container x={20} y={20}>
        <pixiText text="Keyboard Shortcuts" style={titleStyle} />

        {/* Table Header Line */}
        <graphics
          draw={(g: any) => {
            g.moveTo(0, 35);
            g.lineTo(width - 40, 35);
            g.stroke({ width: 1, color: 0x00ff00 });
          }}
        />

        {/* Keystrokes List */}
        <container y={50}>
          {KEYSTROKES.map((k, i) => {
            const rowY = i * 30;
            return (
              <container key={i} y={rowY}>
                <pixiText text={k.keys.join(', ')} style={keyStyle} x={0} />
                <pixiText text={k.description} style={descStyle} x={250} />
                <graphics
                  draw={(g: any) => {
                    g.moveTo(0, 25);
                    g.lineTo(width - 40, 25);
                    g.stroke({ width: 1, color: 0x00ff00, alpha: 0.3 });
                  }}
                />
              </container>
            );
          })}
        </container>

        {/* Footer Note */}
        <container y={height - 60}>
          <graphics
            draw={(g: any) => {
              g.moveTo(0, 0);
              g.lineTo(width - 40, 0);
              g.stroke({ width: 1, color: 0x00ff00 });
            }}
          />
          <pixiText
            text="Note: On Mac, use Option key instead of Alt for the shortcuts above"
            style={noteStyle}
            y={15}
          />
        </container>
      </container>
    </container>
  );
};
