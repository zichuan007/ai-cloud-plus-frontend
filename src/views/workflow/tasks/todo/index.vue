<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="我的待办" name="personal" />
      <el-tab-pane label="组待办池 (可领)" name="group" />
    </el-tabs>

    <el-card>
      <el-table v-loading="loading" :data="tableData" stripe border>
        <el-table-column
          prop="taskName"
          label="任务名称"
          min-width="180"
          align="center"
        />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isGroupTask" type="warning">组任务</el-tag>
            <el-tag v-else type="success">个人任务</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前处理人" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.assignee">{{ row.assignee }}</span>
            <span v-else style="color: #999">待领</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="到达时间"
          width="170"
          align="center"
        />
        <el-table-column label="操作" width="340" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.isGroupTask"
              type="primary"
              size="small"
              @click="handleClaim(row.taskId)"
            >
              签收
            </el-button>
            <el-button
              v-if="!row.isGroupTask"
              type="success"
              size="small"
              @click="handleApprove(row.taskId)"
            >
              审批通过
            </el-button>
            <el-button
              v-if="!row.isGroupTask"
              type="info"
              size="small"
              @click="handleUnclaim(row.taskId)"
            >
              退回组池
            </el-button>
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
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  getPersonalTasks,
  getGroupTasks,
  claimTask,
  unclaimTask,
  approveOneClick,
} from "@/api/workflow";
import { useTable } from "@/hooks/useTable";

const activeTab = ref("personal");

// 使用通用 Table Hook
const { tableData, loading, total, queryParams, handleQuery } = useTable<any>(
  async (params) => {
    const apiFn =
      activeTab.value === "group" ? getGroupTasks : getPersonalTasks;
    const res = await apiFn(params);
    return { records: res.records || [], total: res.total || 0 };
  },
  { current: 1, size: 10, taskName: "" } as const,
);

const handleTabChange = () => {
  queryParams.current = 1;
  handleQuery();
};

const handleClaim = async (taskId: string) => {
  await claimTask(taskId);
  ElMessage.success("签收成功");
  handleQuery();
};

const handleUnclaim = async (taskId: string) => {
  await unclaimTask(taskId);
  ElMessage.info("已退回组池");
  handleQuery();
};

const handleApprove = async (taskId: string) => {
  await approveOneClick(taskId, { approved: true });
  ElMessage.success("审批通过，流程已流转");
  handleQuery();
};

onMounted(() => handleQuery());
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
