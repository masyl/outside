<template>
  <div class="deliveries-list">
    <!-- Ongoing Deliveries -->
    <h2>Ongoing Deliveries</h2>
    <div v-if="ongoing.length === 0">
      <p class="empty">- None</p>
    </div>
    <div v-else>
      <div v-for="delivery in ongoing" :key="delivery.folderName" class="delivery-item">
        <h3>
          <a :href="delivery.path">{{ delivery.Title || 'Untitled' }}</a>
        </h3>
        <div class="meta">
          <span class="date">{{ formatDate(delivery.DeliveryDate) }}</span>
          <span class="status" :class="delivery.Status?.toLowerCase()">{{ delivery.Status }}</span>
        </div>
        <p class="summary">{{ delivery.Summary || '' }}</p>
      </div>
    </div>

    <!-- Completed Deliveries -->
    <h2>Completed Deliveries</h2>
    <div v-for="delivery in completed" :key="delivery.folderName" class="delivery-item">
      <h3>
        <a :href="delivery.path">{{ delivery.Title || 'Untitled' }}</a>
      </h3>
      <div class="meta">
        <span class="date">{{ formatDate(delivery.DeliveryDate) }}</span>
        <span class="status" :class="delivery.Status?.toLowerCase()">{{ delivery.Status }}</span>
      </div>
      <p class="summary">{{ delivery.Summary || '' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { data as deliveriesData } from '../../deliveries/deliveries.data'

// Use data from build-time loader
const deliveries = computed(() => deliveriesData)

// Group by status
const ongoing = computed(() => 
  deliveries.value.filter(d => d.Status === 'TODO' || d.Status === 'DOING')
)

const completed = computed(() => 
  deliveries.value.filter(d => d.Status === 'DONE')
)

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('en-CA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  })
}
</script>

<style scoped>
.deliveries-list {
  margin-top: 2rem;
}

.deliveries-list h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.deliveries-list h2:first-child {
  margin-top: 0;
}

.delivery-item {
  margin-bottom: 2rem;
}

.delivery-item h3 {
  margin-top: 0;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
}

.delivery-item h3 a {
  text-decoration: none;
  color: var(--vp-c-brand-1);
}

.delivery-item h3 a:hover {
  text-decoration: underline;
}

.meta {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.status {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  border: none;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.status.doing {
  background-color: var(--vp-c-yellow-1);
  color: black;
}

.status.todo {
  background-color: var(--vp-c-text-2);
}

.status.done {
  background-color: #166534; /* Dark green for better contrast with white text */
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
</style>
