import DefaultTheme from 'vitepress/theme';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

export default {
  ...DefaultTheme,
  setup() {
    const route = useRoute();

    const initMermaid = async () => {
      // Only run in browser
      if (typeof window === 'undefined') return;

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'default' });

        await nextTick();

        // Find all .mermaid elements
        const elements = Array.from(document.querySelectorAll('.mermaid')) as HTMLElement[];
        if (!elements.length) return;

        // Process each element
        // mermaid.run({ nodes: ... }) works in v10+
        await mermaid.run({
          nodes: elements,
        });
      } catch (e) {
        console.error('Mermaid init failed:', e);
      }
    };

    onMounted(() => {
      initMermaid();
    });

    watch(
      () => route.path,
      () => nextTick(() => initMermaid())
    );
  },
};
