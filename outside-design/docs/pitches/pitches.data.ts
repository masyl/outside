import { createContentLoader } from 'vitepress';

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default createContentLoader('pitches/*.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(rawData) {
    return rawData
      .filter((page) => {
        const last = page.url.split('/').pop() ?? '';
        const slug = last.replace(/\.html$/, '');
        return slug !== 'index' && slug.length > 0;
      })
      .map((page) => {
        const last = page.url.split('/').pop() ?? '';
        const slug = last.replace(/\.html$/, '');
        const title =
          page.frontmatter?.Title ?? slugToTitle(slug);
        return {
          Title: title,
          Summary: page.frontmatter?.Summary as string | undefined,
          Category: page.frontmatter?.Category as string | undefined,
          DeliveryLink: page.frontmatter?.DeliveryLink as string | undefined,
          Status: (page.frontmatter?.Status ?? 'open').toString().toLowerCase(),
          path: page.url,
          slug,
        };
      })
      .sort((a, b) => {
        const aDelivered = Boolean(a.DeliveryLink);
        const bDelivered = Boolean(b.DeliveryLink);
        if (aDelivered !== bDelivered) return aDelivered ? -1 : 1;
        return (a.Title ?? '').localeCompare(b.Title ?? '');
      });
  },
});
