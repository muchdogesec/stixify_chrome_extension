<template>
  <div class="state">
    <div class="success">
      <p class="state-title">
        <Icon name="check-circle" :size="20" />
        Successfully submitted!
      </p>
      <p class="help-text">Your webpage has been converted and sent to Stixify for processing.</p>
      <button @click="$emit('submit-another')" class="btn btn-primary">Submit Another</button>
    </div>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'SuccessState',
  components: { Icon },
  emits: ['submit-another']
};
</script>
