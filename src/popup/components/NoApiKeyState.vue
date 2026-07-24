<template>
  <div class="state">
    <div class="warning">
      <p class="state-title">
        <Icon name="alert-triangle" :size="20" />
        No API key configured
      </p>
      <p class="help-text">Please add your Stixify API key in the settings to use this extension.</p>
      <button @click="$emit('open-settings')" class="btn btn-primary">Open Settings</button>
    </div>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'NoApiKeyState',
  components: { Icon },
  emits: ['open-settings']
};
</script>
