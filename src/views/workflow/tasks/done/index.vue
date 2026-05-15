<template>
  <div class="page-container">
    <el-card>
      <template #header><span>已办任务</span></template>
      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column prop="taskName" label="任务名称" min-width="180" />
        <el-table-column prop="processName" label="流程名称" min-width="150" />
        <el-table-column prop="startUserName" label="发起人" width="120" />
        <el-table-column prop="createTime" label="处理时间" width="170" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.size"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { getDoneTasks } from "@/api/workflow";
import type { TodoTaskVO } from "@/types";
import { useTable } from "@/hooks/useTable";

const router = useRouter();

// 使用通用 Table Hook
const {
  tableData,
  loading,
  total,
  queryParams,
  handleQuery,
} = useTable<TodoTaskVO>(async (params) => {
  const res = await getDoneTasks(params);
  return { records: Array.isArray(res) ? res : (res as any).records || [], total: Array.isArray(res) ? res.length : (res as any).total || 0 };
}, { current: 1, size: 10 });

function handleDetail(row: TodoTaskVO) {
  router.push({
    path: "/workflow/instances/detail",
    query: { id: row.processInstanceId },
  });
}

onMounted(() => handleQuery());
</script>

<style scoped lang="scss">
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
