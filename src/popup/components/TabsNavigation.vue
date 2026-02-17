<template>
  <div class="tabs">
    <button class="tab-btn" :class="{ active: activeTab === 'submit' }" @click="$emit('tab-change', 'submit')">
      Submit
    </button>
    <button class="tab-btn" :class="{ active: activeTab === 'jobs' }" @click="$emit('tab-change', 'jobs')">
      Jobs
      <span v-if="processingJobsCount > 0" class="badge">{{ processingJobsCount }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TabsNavigation',
  props: {
    activeTab: {
      type: String,
      required: true
    },
    processingJobsCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['tab-change']
};
</script>
