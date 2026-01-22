import { createContentLoader } from 'vitepress';

export default createContentLoader('deliveries/*/README.md', {
  includeSrc: false,
  render: false,
  excerpt: false,
  transform(rawData) {
    return rawData
      .map((page) => {
        return {
          Title: page.frontmatter.Title,
          DeliveryDate: page.frontmatter.DeliveryDate,
          Summary: page.frontmatter.Summary,
          Status: page.frontmatter.Status || 'DONE',
          Branch: page.frontmatter.Branch,
          Commit: page.frontmatter.Commit,
          path: page.url,
          folderName: page.url.split('/').slice(-2, -1)[0],
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.DeliveryDate || 0);
        const dateB = new Date(b.DeliveryDate || 0);
        const timeDiff = dateB.getTime() - dateA.getTime();

        if (timeDiff !== 0) {
          return timeDiff;
        }

        // Secondary sort by folder name (contains timestamp) descending
        return b.folderName.localeCompare(a.folderName);
      });
  },
});
