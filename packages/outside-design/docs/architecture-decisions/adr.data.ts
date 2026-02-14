import { createContentLoader } from 'vitepress';

function extractADRNumber(filename: string): number {
  const match = filename.match(/^ADR-(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

function extractADRTitle(filename: string): string {
  // Remove ADR-NNN- prefix and .md extension
  return filename
    .replace(/^ADR-\d+-/, '')
    .replace(/\.md$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default createContentLoader('../../../docs/adr/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(rawData) {
    return rawData
      .filter((page) => {
        const last = page.url.split('/').pop() ?? '';
        const slug = last.replace(/\.html$/, '');
        return !slug.includes('README');
      })
      .map((page) => {
        const last = page.url.split('/').pop() ?? '';
        const slug = last.replace(/\.html$/, '');
        const adrNumber = extractADRNumber(slug);
        const title = page.frontmatter?.name
          ? page.frontmatter.name.replace(/ – Ȯ$/, '')
          : extractADRTitle(slug);

        // Generate path within the VitePress site (under /adr/ symlink in docs)
        const adrPath = `/adr/${slug}`;

        return {
          adrNumber,
          title,
          status: (page.frontmatter?.status ?? 'Proposed').toString(),
          path: adrPath,
          slug,
        };
      })
      .sort((a, b) => a.adrNumber - b.adrNumber);
  },
});
