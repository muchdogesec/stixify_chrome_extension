<template>
  <div class="state">
    <div class="warning">
      <p>🚫 Upload Limit Reached</p>
      <p class="help-text">Please upgrade your account. You have reached the limit of uploads for your team's plan.</p>
      <button @click="openUpgradePage" class="btn btn-secondary">Upgrade Plan</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuotaExceededState',
  methods: {
    openUpgradePage() {
      chrome.tabs.create({ url: 'https://stixify.com/pricing' });
    }
  }
};
</script>
