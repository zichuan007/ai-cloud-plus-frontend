<template>
  <div class="page-container">
    <el-card>
      <template #header><span>我发起的</span></template>
      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column prop="processName" label="流程名称" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 1
                  ? 'primary'
                  : row.status === 2
                    ? 'success'
                    : 'danger'
              "
            >
              {{
                row.status === 1
                  ? "审批中"
                  : row.status === 2
                    ? "已完成"
                    : "已终止"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="发起时间" width="170" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row)"
              >查看进度</el-button
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
import { getInitiatedTasks } from "@/api/workflow";
import type { InstanceVO } from "@/types";
import { useTable } from "@/hooks/useTable";

const router = useRouter();

// 使用通用 Table Hook
const {
  tableData,
  loading,
  total,
  queryParams,
  handleQuery,
} = useTable<InstanceVO>(async (params) => {
  const res = await getInitiatedTasks(params);
  return { records: Array.isArray(res) ? res : (res as any).records || [], total: Array.isArray(res) ? res.length : (res as any).total || 0 };
}, { current: 1, size: 10 });

function handleDetail(row: InstanceVO) {
  router.push({
    path: "/workflow/instances/detail",
    query: { id: row.instanceId },
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
