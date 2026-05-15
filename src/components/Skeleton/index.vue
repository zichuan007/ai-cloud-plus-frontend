<template>
  <div class="skeleton-wrapper" :style="{ padding: padding }">
    <template v-if="loading">
      <div
        v-for="i in count"
        :key="i"
        class="skeleton-item"
        :class="{ 'is-animated': animated }"
        :style="{ height: height, marginBottom: gap }"
      >
        <el-skeleton :rows="rows" :animated="animated" />
      </div>
    </template>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading?: boolean;
  count?: number;
  rows?: number;
  height?: string;
  gap?: string;
  padding?: string;
  animated?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: true,
  count: 3,
  rows: 3,
  height: "auto",
  gap: "16px",
  padding: "20px",
  animated: true,
});
</script>

<style scoped lang="scss">
.skeleton-wrapper {
  width: 100%;
  min-height: 100px;

  .skeleton-item {
    background: #f5f7fa;
    border-radius: 8px;
    overflow: hidden;

    &.is-animated {
      animation: skeleton-loading 1.5s infinite linear;
    }
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
