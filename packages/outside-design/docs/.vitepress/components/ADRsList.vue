<template>
  <div class="adrs-list">
    <div v-if="adrs.length === 0">
      <p class="empty">- No Architecture Decision Records</p>
    </div>
    <div v-else>
      <div v-for="adr in adrs" :key="adr.slug" class="adr-item">
        <h3>
          <a :href="adr.path">ADR-{{ padADRNumber(adr.adrNumber) }}: {{ adr.title }}</a>
          <span class="status" :class="adr.status?.toLowerCase()">{{ adr.status }}</span>
        </h3>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { data as adrsData } from '../../architecture-decisions/adr.data';

const adrs = computed(() => adrsData ?? []);

const padADRNumber = (num) => {
  return String(num).padStart(3, '0');
};
</script>

<style scoped>
.adrs-list {
  margin-top: 2rem;
}

.adr-item {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.adr-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.adr-item h3 {
  margin-top: 0;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.adr-item h3 a {
  text-decoration: none;
  color: var(--vp-c-brand-1);
  flex: 1;
}

.adr-item h3 a:hover {
  text-decoration: underline;
}

.status {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
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

.empty {
  color: var(--vp-c-text-3);
  font-style: italic;
}
</style>
