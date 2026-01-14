import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid({
  title: 'Outside Design',
  description: 'Design documentation and process for the Outside game',

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Deliveries', link: '/deliveries/' },
      { text: 'Design Process', link: '/design-process/' },
      { text: 'Components', link: '/components/' },
      { text: 'Style Guide', link: '/style-guide/' },
    ],

    sidebar: {
      '/deliveries/': [
        {
          text: 'Deliveries',
          items: [{ text: 'Overview', link: '/deliveries/' }],
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
      '/style-guide/': [
        {
          text: 'Style Guide',
          items: [
            { text: 'Overview', link: '/style-guide/' },
            { text: 'Colors', link: '/style-guide/colors' },
            { text: 'Typography', link: '/style-guide/typography' },
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
