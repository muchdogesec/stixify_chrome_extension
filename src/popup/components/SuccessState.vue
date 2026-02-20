<template>
  <div class="state">
    <div class="success">
      <p>✅ Successfully submitted!</p>
      <p class="help-text">Your webpage has been converted and sent to Stixify for processing.</p>
      <button @click="$emit('submit-another')" class="btn btn-primary">Submit Another</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SuccessState',
  emits: ['submit-another']
};
</script>
