<template>
  <div class="pagination-wrapper">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :background="background"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  total: number;
  page?: number;
  limit?: number;
  pageSizes?: number[];
  layout?: string;
  background?: boolean;
}>(), {
  page: 1,
  limit: 10,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
});

const emit = defineEmits<{
  (e: 'update:page', val: number): void;
  (e: 'update:limit', val: number): void;
  (e: 'pagination'): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: (val: number) => emit('update:page', val),
});

const pageSize = computed({
  get: () => props.limit,
  set: (val: number) => emit('update:limit', val),
});

function handleSizeChange() {
  emit('update:page', 1);
  emit('pagination');
}

function handleCurrentChange() {
  emit('pagination');
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
