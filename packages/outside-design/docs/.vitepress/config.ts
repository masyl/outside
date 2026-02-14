import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Ȯutside Documentation',
  description: 'Documentation for the Ȯutside game plateform',

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
      { text: 'ADRs', link: '/architecture-decisions' },
      { text: 'Dev', link: '/development-process/' },
      { text: 'API', link: '/api/' },
      { text: 'Storybook', link: '/storybook' },
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
      '/architecture-decisions': [
        {
          text: 'Architecture Decision Records',
          items: [{ text: 'Overview', link: '/architecture-decisions' }],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/masyl/outside' }],

    search: {
      provider: 'local',
    },
  },
});
