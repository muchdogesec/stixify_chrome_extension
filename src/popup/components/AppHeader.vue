<template>
  <div class="header">
    <img src="/assets/images/header.png" alt="Stixify" class="logo">
    <button @click="$emit('open-settings')" class="icon-btn" title="Settings">
      <Icon name="settings" :size="18" />
    </button>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'AppHeader',
  components: { Icon },
  emits: ['open-settings']
};
</script>
