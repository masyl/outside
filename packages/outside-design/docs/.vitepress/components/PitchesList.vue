<template>
  <div class="pitches-list">
    <!-- Delivered Pitches -->
    <h2>Delivered Pitches</h2>
    <div v-if="delivered.length === 0">
      <p class="empty">- None</p>
    </div>
    <div v-else>
      <div v-for="pitch in delivered" :key="pitch.slug" class="pitch-item">
        <h3>
          <a :href="pitch.DeliveryLink">{{ pitch.Title || 'Untitled' }}</a>
          <span class="meta-links">
            <a :href="pitch.path" class="pitch-archived">Pitch (archived)</a>
          </span>
        </h3>
        <p v-if="pitch.Summary" class="summary">{{ pitch.Summary }}</p>
      </div>
    </div>

    <!-- Open Pitches -->
    <h2>Open Pitches</h2>
    <template v-if="openByCategory.length > 0">
      <div
        v-for="group in openByCategory"
        :key="group.category || 'default'"
        class="pitch-group"
      >
        <h3 v-if="group.category" class="category-heading">{{ group.category }}</h3>
        <div v-for="pitch in group.pitches" :key="pitch.slug" class="pitch-item">
          <h3>
            <a :href="pitch.path">{{ pitch.Title || 'Untitled' }}</a>
            <span v-if="pitch.Status === 'draft'" class="status draft">Draft</span>
          </h3>
          <p v-if="pitch.Summary" class="summary">{{ pitch.Summary }}</p>
        </div>
      </div>
    </template>
    <div v-else>
      <p class="empty">- None</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { data as pitchesData } from '../../pitches/pitches.data';

const pitches = computed(() => pitchesData ?? []);

const delivered = computed(() =>
  pitches.value.filter((p) => p.DeliveryLink)
);

const open = computed(() =>
  pitches.value.filter((p) => !p.DeliveryLink)
);

const openByCategory = computed(() => {
  const withCategory = open.value.filter((p) => p.Category);
  const withoutCategory = open.value.filter((p) => !p.Category);
  const byCategory = new Map();
  for (const p of withCategory) {
    const cat = p.Category || 'Other';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(p);
  }
  const groups = [];
  for (const [category, items] of byCategory) {
    groups.push({ category, pitches: items });
  }
  groups.sort((a, b) => a.category.localeCompare(b.category));
  if (withoutCategory.length > 0) {
    groups.push({ category: null, pitches: withoutCategory });
  }
  return groups;
});
</script>

<style scoped>
.pitches-list {
  margin-top: 2rem;
}

.pitches-list h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.pitches-list h2:first-child {
  margin-top: 0;
}

.pitch-group {
  margin-bottom: 1.5rem;
}

.category-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 0.75rem;
  margin-top: 0;
}

.pitch-item {
  margin-bottom: 2rem;
}

.pitch-item h3 {
  margin-top: 0;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
}

.pitch-item h3 a {
  text-decoration: none;
  color: var(--vp-c-brand-1);
}

.pitch-item h3 a:hover {
  text-decoration: underline;
}

.meta-links {
  font-size: 0.85rem;
  font-weight: normal;
  margin-left: 0.5rem;
}

.meta-links .pitch-archived {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.meta-links .pitch-archived:hover {
  text-decoration: underline;
}

.summary {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  line-height: 1.5;
}

.empty {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.status {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 0.5rem;
  vertical-align: middle;
}

.status.draft {
  background-color: var(--vp-c-text-2);
  color: white;
}
</style>
