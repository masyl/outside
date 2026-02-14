<template>
  <div class="adrs-list">
    <div v-if="displayedADRs.length === 0">
      <p class="empty">- No Architecture Decision Records</p>
    </div>
    <div v-else>
      <div v-for="adr in displayedADRs" :key="adr.slug" class="adr-item">
        <div class="adr-header">
          <a :href="adr.path" class="adr-link">ADR-{{ padADRNumber(adr.adrNumber) }}: {{ adr.title }}</a>
          <span class="status" :class="adr.status?.toLowerCase()">{{ adr.status }}</span>
        </div>
      </div>
    </div>
    <div v-if="showViewAllButton" class="view-all">
      <a href="/architecture-decisions" class="view-all-button">View all {{ allADRs.length }} decisions →</a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { data as adrsData } from '../../architecture-decisions/adr.data';

defineProps({
  limit: {
    type: Number,
    default: null
  }
});

const allADRs = computed(() => {
  const data = adrsData ?? [];
  // Sort in reverse chronological order (newest first)
  return [...data].sort((a, b) => b.adrNumber - a.adrNumber);
});

const displayedADRs = computed(() => {
  if (!limit.value) {
    return allADRs.value;
  }
  return allADRs.value.slice(0, limit.value);
});

const showViewAllButton = computed(() => {
  return limit.value && allADRs.value.length > limit.value;
});

const padADRNumber = (num) => {
  return String(num).padStart(3, '0');
};

const limit = computed(() => $props.limit);
</script>

<style scoped>
.adrs-list {
  margin-top: 1.5rem;
}

.adr-item {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.adr-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.adr-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.adr-link {
  text-decoration: none;
  color: var(--vp-c-brand-1);
  font-weight: 500;
  font-size: 0.95rem;
  flex: 1;
  line-height: 1.3;
}

.adr-link:hover {
  text-decoration: underline;
}

.status {
  font-size: 0.6rem;
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  color: white;
}

.status.accepted {
  background-color: #166534; /* Dark green */
}

.status.proposed {
  background-color: var(--vp-c-yellow-1);
  color: black;
}

.status.deprecated {
  background-color: var(--vp-c-text-2);
}

.status.superseded {
  background-color: var(--vp-c-text-2);
}

.view-all {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.view-all-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.view-all-button:hover {
  background-color: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand-1);
}

.empty {
  color: var(--vp-c-text-3);
  font-style: italic;
}
</style>
