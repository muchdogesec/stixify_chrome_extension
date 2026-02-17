<template>
  <div class="header">
    <img src="/assets/images/header.png" alt="Stixify" class="logo">
    <button @click="$emit('open-settings')" class="icon-btn" title="Settings">⚙️</button>
  </div>
</template>

<script>
export default {
  name: 'AppHeader',
  emits: ['open-settings']
};
</script>
