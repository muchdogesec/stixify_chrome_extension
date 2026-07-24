<template>
  <transition name="floating-loader-fade">
    <div v-if="status" class="floating-loader" :class="status" :title="title">
      <Icon :name="status === 'error' ? 'alert-triangle' : 'spinner'" :size="16" class="floating-loader-icon" />
    </div>
  </transition>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'FloatingLoader',
  components: { Icon },
  props: {
    status: {
      type: String,
      default: null // 'loading' | 'error' | null
    },
    title: {
      type: String,
      default: ''
    }
  }
};
</script>
