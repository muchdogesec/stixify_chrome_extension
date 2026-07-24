<template>
  <div class="state">
    <div class="error">
      <p class="state-title">
        <Icon name="x-circle" :size="20" />
        Error
      </p>
      <p class="help-text">{{ errorMessage }}</p>
      <button @click="$emit('retry')" class="btn btn-primary">Try Again</button>
    </div>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'ErrorState',
  components: { Icon },
  props: {
    errorMessage: {
      type: String,
      required: true
    }
  },
  emits: ['retry']
};
</script>
