<template>
  <div class="state">
    <div class="error">
      <p>❌ Error</p>
      <p class="help-text">{{ errorMessage }}</p>
      <button @click="$emit('retry')" class="btn btn-primary">Try Again</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ErrorState',
  props: {
    errorMessage: {
      type: String,
      required: true
    }
  },
  emits: ['retry']
};
</script>
