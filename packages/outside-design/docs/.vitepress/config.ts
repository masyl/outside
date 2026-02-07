import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Outside Design',
  description: 'Design documentation and process for the Outside game',

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
      { text: 'Deliveries', link: '/deliveries/' },
      { text: 'Pitches', link: '/pitches/' },
      { text: 'Design Process', link: '/design-process/' },
      { text: 'Components', link: '/components/' },
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
          ],
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
