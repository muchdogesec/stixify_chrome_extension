<template>
  <div class="state">
    <div class="warning">
      <p class="state-title">
        <Icon name="slash" :size="20" />
        Upload Limit Reached
      </p>
      <p class="help-text">Please upgrade your account. You have reached the limit of uploads for your team's plan.</p>
      <button @click="openUpgradePage" class="btn btn-secondary">Upgrade Plan</button>
    </div>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'QuotaExceededState',
  components: { Icon },
  methods: {
    openUpgradePage() {
      chrome.tabs.create({ url: 'https://stixify.com/pricing' });
    }
  }
};
</script>
