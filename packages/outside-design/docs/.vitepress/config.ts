import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  title: 'Ȯutside Documentation',
  description: 'Documentation for the Ȯutside game plateform',

  ignoreDeadLinks: [
    // ADR pages are served from root docs directory
    /^\/adr\//,
    // Cross-document links that reference files outside the design docs
    /^\.\.\//,
    // Links to root docs directory files
    /^\/\.\.\//,
  ],

  vite: {
    fs: {
      // Allow Vite to access files outside the docs directory (for ADRs)
      allow: [resolve(__dirname, '../../../..')],
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    config: (md) => {
      // Custom fence renderer for mermaid
      const defaultFence =
        md.renderer.rules.fence ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options);
        };

      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        if (token.info.trim() === 'mermaid') {
          return `<div class="mermaid">${token.content}</div>`;
        }
        return defaultFence(tokens, idx, options, env, self);
      };
    },
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Pitches', link: '/pitches/' },
      { text: 'Deliveries', link: '/deliveries/' },
      { text: 'Questions', link: '/questions/' },
      { text: 'Design', link: '/design-process/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Dev', link: '/development-process/' },
      { text: 'API', link: '/api/' },
      { text: 'Storybook', link: '/storybook' },
      { text: 'Credits', link: '/credits' },
    ],

    sidebar: {
      '/deliveries/': [
        {
          text: 'Deliveries',
          items: [{ text: 'Overview', link: '/deliveries/' }],
        },
      ],
      '/pitches/': [
        {
          text: 'Pitches',
          items: [{ text: 'Overview', link: '/pitches/' }],
        },
      ],
      '/design-process/': [
        {
          text: 'Design Process',
          items: [
            { text: 'Overview', link: '/design-process/' },
            { text: 'Research Phase', link: '/design-process/research' },
            { text: 'Ideation Phase', link: '/design-process/ideation' },
            { text: 'Pitch Phase', link: '/design-process/pitch-phase' },
            { text: 'Meaning of Design', link: '/design-process/meaning-of-design' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'Choosing an ECS Library', link: '/architecture/choosing-ecs-library' },
            { text: 'TypeScript ECS Comparison', link: '/architecture/typescript-ecs-libraries-comparison' },
            { text: 'Open Source Dependencies', link: '/architecture/open-source-dependencies' },
            { text: 'Self-Hosting and Bootstrapping', link: '/architecture/self-hosting-and-bootstrapping' },
            { text: 'Decision Records', link: '/architecture-decisions' },
          ],
        },
      ],
      '/development-process/': [
        {
          text: 'Development Process',
          items: [
            { text: 'Overview', link: '/development-process/' },
            { text: 'Quick Start', link: '/development-process/quick-start' },
            { text: 'Skills Sync', link: '/development-process/skills-sync' },
            { text: 'Storybook Component Testing', link: '/storybook' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [{ text: 'Overview', link: '/api/' }],
        },
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'UI Elements', link: '/components/ui-elements' },
            { text: 'Game Components', link: '/components/game-components' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/masyl/outside' }],

    search: {
      provider: 'local',
    },
  },
});
