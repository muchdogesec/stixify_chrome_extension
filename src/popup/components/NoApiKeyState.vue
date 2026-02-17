<template>
  <div class="state">
    <div class="warning">
      <p>⚠️ No API key configured</p>
      <p class="help-text">Please add your Stixify API key in the settings to use this extension.</p>
      <button @click="$emit('open-settings')" class="btn btn-primary">Open Settings</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NoApiKeyState',
  emits: ['open-settings']
};
</script>
